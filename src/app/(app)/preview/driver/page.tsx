import { createClient } from "@/lib/supabase/server";
import { PhoneDriver, type PublicDriver } from "@/components/PhoneDriver";
import { PreviewPicker } from "../PreviewPicker";

/** Prototype "Driver update" view: the real daily-update link in a phone frame. */
export default async function DriverPreview({ searchParams }: { searchParams: Promise<{ emp?: string }> }) {
  const { emp } = await searchParams;
  const supabase = await createClient();
  const { data: emps } = await supabase.from("employees").select("id, name").order("name");
  const list = emps || [];
  const cur = list.find((e) => e.id === emp) || list[0];
  const { data } = cur ? await supabase.rpc("public_driver", { p_id: cur.id }) : { data: null };

  return (
    <div className="phone-stage">
      <PreviewPicker label="Logged in as" param="emp" value={cur?.id || ""} options={list.map((e) => ({ value: e.id, label: e.name }))} />
      <div className="phone">
        {data ? (
          <PhoneDriver key={cur!.id} initial={data as PublicDriver} />
        ) : (
          <div className="public-err">No employees yet. Add one under BLC Drivers to preview their link.</div>
        )}
      </div>
      <div className="phone-note">What a BLC driver opens from their link to log the day. Submissions feed the shift records and salary slips.</div>
    </div>
  );
}
