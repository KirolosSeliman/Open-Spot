import { SmsTemplateEditor } from "@/components/messages/sms-template-editor";
import { loadSmsTemplatesPageData } from "@/lib/dashboard/sms-template-actions";

export default async function MessagesPage() {
  const { canEdit, templates } = await loadSmsTemplatesPageData();

  return (
    <div className="grid min-w-0 max-w-full gap-8">
      <header className="min-w-0 max-w-3xl">
        <h1 className="os-mobile-page-title text-[clamp(2rem,4vw,2.625rem)] font-black tracking-tight text-[#07142f]">
          Templates SMS
        </h1>
        <p className="mt-3 text-base leading-7 text-[#64748b]">
          Créez et personnalisez vos messages SMS pour les alertes de créneaux
          et les confirmations.
        </p>
      </header>

      <SmsTemplateEditor canEdit={canEdit} initialTemplates={templates} />
    </div>
  );
}
