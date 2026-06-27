"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";

import { SmsPreviewPanel } from "@/components/messages/sms-preview-phone";
import { SmsVariableChips } from "@/components/messages/sms-variable-chips";
import { deleteSmsTemplateAction, saveSmsTemplateAction } from "@/lib/dashboard/sms-template-actions";
import type { OrganizationSmsTemplateRecord } from "@/lib/sms/organization-templates";
import { formatSmsCounterLabel } from "@/lib/sms/sms-counter";
import { renderSmsTemplatePreview } from "@/lib/sms/template-renderer";
import {
  buildSmsTemplateSelectionOptions,
  buildTemplateSelectionId,
  formatTemplateSelectionLabel,
  parseTemplateSelectionId,
  type SmsTemplateSelectionOption
} from "@/lib/sms/template-selection";
import {
  getDefaultTemplateBody,
  getDefaultTemplateName,
  SMS_TEMPLATE_DEFINITIONS,
  SMS_TEMPLATE_NAME_MAX_LENGTH,
  validateSmsTemplateInput,
  type SmsTemplateKey,
  type SmsTemplateLanguage,
  type SmsTemplateVariable
} from "@/lib/sms/template-variables";
import { cn } from "@/lib/utils/cn";

type ToastState = {
  tone: "success" | "error";
  message: string;
} | null;

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg",
        toast.tone === "success"
          ? "border-[#86efac] bg-[#ecfdf3] text-[#166534]"
          : "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]"
      )}
      role="status"
    >
      {toast.message}
    </div>
  );
}


export function SmsTemplateEditor({
  canEdit,
  initialTemplates
}: {
  canEdit: boolean;
  initialTemplates: OrganizationSmsTemplateRecord[];
}) {
  const [templates, setTemplates] =
    useState<OrganizationSmsTemplateRecord[]>(initialTemplates);
  const [templateKey, setTemplateKey] =
    useState<SmsTemplateKey>("opening_alert");
  const [language, setLanguage] = useState<SmsTemplateLanguage>("fr");
  const [selectedTemplateId, setSelectedTemplateId] = useState(() =>
    buildTemplateSelectionId("opening_alert", "fr")
  );
  const [name, setName] = useState(() =>
    getDefaultTemplateName("opening_alert", "fr")
  );
  const [message, setMessage] = useState(() =>
    getDefaultTemplateBody("opening_alert", "fr")
  );
  const [previewMessage, setPreviewMessage] = useState(() =>
    renderSmsTemplatePreview(getDefaultTemplateBody("opening_alert", "fr"), "fr")
  );
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const counter = useMemo(() => formatSmsCounterLabel(message), [message]);
  const templateOptions = useMemo(
    () =>
      (Object.keys(SMS_TEMPLATE_DEFINITIONS) as SmsTemplateKey[]).map((key) => ({
        key,
        label: SMS_TEMPLATE_DEFINITIONS[key].label.fr
      })),
    []
  );
  const savedTemplateOptions = useMemo(
    () => buildSmsTemplateSelectionOptions(templates),
    [templates]
  );
  const savedTemplateOptionsForType = useMemo(
    () =>
      savedTemplateOptions.filter((option) => option.templateKey === templateKey),
    [savedTemplateOptions, templateKey]
  );
  const currentSelection = useMemo(
    () =>
      savedTemplateOptions.find((option) => option.id === selectedTemplateId) ??
      savedTemplateOptions[0],
    [savedTemplateOptions, selectedTemplateId]
  );

  const applySelection = useCallback((option: SmsTemplateSelectionOption) => {
    setSelectedTemplateId(option.id);
    setTemplateKey(option.templateKey);
    setLanguage(option.language);
    setName(option.name);
    setMessage(option.body);
    setPreviewMessage(renderSmsTemplatePreview(option.body, option.language));
    setWarnings([]);
    setErrors([]);
  }, []);

  const applyTemplateState = useCallback(
    (nextTemplateKey: SmsTemplateKey, nextLanguage: SmsTemplateLanguage) => {
      const option = savedTemplateOptions.find(
        (candidate) =>
          candidate.templateKey === nextTemplateKey &&
          candidate.language === nextLanguage
      );

      if (option) {
        applySelection(option);
        return;
      }

      const nextBody = getDefaultTemplateBody(nextTemplateKey, nextLanguage);
      const nextName = getDefaultTemplateName(nextTemplateKey, nextLanguage);
      const nextId = buildTemplateSelectionId(nextTemplateKey, nextLanguage);

      setSelectedTemplateId(nextId);
      setTemplateKey(nextTemplateKey);
      setLanguage(nextLanguage);
      setName(nextName);
      setMessage(nextBody);
      setPreviewMessage(renderSmsTemplatePreview(nextBody, nextLanguage));
      setWarnings([]);
      setErrors([]);
    },
    [applySelection, savedTemplateOptions]
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleInsertVariable = (variable: SmsTemplateVariable) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      const nextMessage = `${message}${message.endsWith("\n") || message.length === 0 ? "" : " "}${variable}`;
      setMessage(nextMessage);
      setPreviewMessage(renderSmsTemplatePreview(nextMessage, language));
      return;
    }

    const start = textarea.selectionStart ?? message.length;
    const end = textarea.selectionEnd ?? message.length;
    const nextMessage = `${message.slice(0, start)}${variable}${message.slice(end)}`;
    setMessage(nextMessage);
    setPreviewMessage(renderSmsTemplatePreview(nextMessage, language));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + variable.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleResetVariables = () => {
    const defaultBody = getDefaultTemplateBody(templateKey, language);
    const shouldReset = message === defaultBody || window.confirm(
      "Réinitialiser le message avec le modèle par défaut et toutes les variables disponibles ?"
    );

    if (!shouldReset) {
      return;
    }

    setMessage(defaultBody);
    setPreviewMessage(renderSmsTemplatePreview(defaultBody, language));
    setWarnings([]);
    setErrors([]);
  };

  const handlePreview = () => {
    setPreviewMessage(renderSmsTemplatePreview(message, language));
    const validation = validateSmsTemplateInput({
      templateKey,
      language,
      name,
      body: message
    });
    setWarnings(validation.warnings);
    setErrors(validation.errors);
  };

  const handleSave = () => {
    const validation = validateSmsTemplateInput({
      templateKey,
      language,
      name,
      body: message
    });
    setWarnings(validation.warnings);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setToast({
        tone: "error",
        message: "Impossible d'enregistrer le template pour le moment."
      });
      return;
    }

    const formData = new FormData();
    formData.set("templateKey", templateKey);
    formData.set("language", language);
    formData.set("name", name);
    formData.set("body", message);

    startTransition(async () => {
      const result = await saveSmsTemplateAction(formData);

      if (!result.ok) {
        setErrors(result.errors);
        setWarnings(result.warnings);
        setToast({
          tone: "error",
          message: result.message
        });
        return;
      }

      setTemplates((current) => {
        const next = current.filter(
          (template) =>
            !(
              template.templateKey === templateKey &&
              template.language === language
            )
        );

        return [...next, result.savedTemplate];
      });
      setSelectedTemplateId(buildTemplateSelectionId(templateKey, language));
      setPreviewMessage(renderSmsTemplatePreview(result.savedBody, language));
      setWarnings(result.warnings);
      setToast({
        tone: "success",
        message: result.message
      });
    });
  };

  const handleDelete = () => {
    if (!currentSelection?.isSaved) {
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce template enregistré et revenir au modèle par défaut Open Spot ?"
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData();
    formData.set("templateKey", templateKey);
    formData.set("language", language);

    startDeleteTransition(async () => {
      const result = await deleteSmsTemplateAction(formData);

      if (!result.ok) {
        setToast({
          tone: "error",
          message: result.message
        });
        return;
      }

      setTemplates((current) =>
        current.filter(
          (template) =>
            !(
              template.templateKey === result.templateKey &&
              template.language === result.language
            )
        )
      );

      const defaultBody = getDefaultTemplateBody(result.templateKey, result.language);
      const defaultName = getDefaultTemplateName(result.templateKey, result.language);

      setSelectedTemplateId(
        buildTemplateSelectionId(result.templateKey, result.language)
      );
      setTemplateKey(result.templateKey);
      setLanguage(result.language);
      setName(defaultName);
      setMessage(defaultBody);
      setPreviewMessage(renderSmsTemplatePreview(defaultBody, result.language));
      setWarnings([]);
      setErrors([]);
      setToast({
        tone: "success",
        message: result.message
      });
    });
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] xl:gap-8">
        <section className="rounded-[1.35rem] border border-[#dde5f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {templateOptions.map((option) => {
              const isActive = option.key === templateKey;

              return (
                <button
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2",
                    isActive
                      ? "bg-[#eef4ff] text-[#2563ff]"
                      : "border border-[#dde5f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
                  )}
                  key={option.key}
                  onClick={() => {
                    const preferred =
                      savedTemplateOptionsForType.find(
                        (candidate) => candidate.language === language
                      ) ??
                      savedTemplateOptionsForType[0];

                    if (preferred) {
                      applySelection(preferred);
                      return;
                    }

                    applyTemplateState(option.key, language);
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-6">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#07142f]">
                Template enregistré
              </span>
              <div className="relative">
                <select
                  className="min-h-12 w-full appearance-none rounded-xl border border-[#dde5f0] bg-white px-4 pr-10 text-sm text-[#07142f] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff]"
                  onChange={(event) => {
                    const parsed = parseTemplateSelectionId(event.target.value);
                    const option = savedTemplateOptions.find(
                      (candidate) => candidate.id === event.target.value
                    );

                    if (parsed && option) {
                      applySelection(option);
                    }
                  }}
                  value={selectedTemplateId}
                >
                  {savedTemplateOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {formatTemplateSelectionLabel(option)}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#64748b]">
                  ▾
                </span>
              </div>
              <p className="text-xs leading-5 text-[#64748b]">
                {savedTemplateOptions.find((option) => option.id === selectedTemplateId)
                  ?.isSaved
                  ? "Version personnalisée enregistrée pour votre commerce."
                  : "Modèle par défaut Open Spot. Enregistrez pour créer votre version personnalisée."}
              </p>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#07142f]">
                Nom du template
              </span>
              <div className="relative">
                <input
                  className="min-h-12 w-full rounded-xl border border-[#dde5f0] bg-white px-4 pr-16 text-sm text-[#07142f] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                  disabled={!canEdit}
                  maxLength={SMS_TEMPLATE_NAME_MAX_LENGTH}
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-[#94a3b8]">
                  {name.length}/{SMS_TEMPLATE_NAME_MAX_LENGTH}
                </span>
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#07142f]">Langue</span>
              <div className="relative">
                <select
                  className="min-h-12 w-full appearance-none rounded-xl border border-[#dde5f0] bg-white px-4 pr-10 text-sm text-[#07142f] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                  disabled={!canEdit}
                  onChange={(event) =>
                    applyTemplateState(
                      templateKey,
                      event.target.value === "en" ? "en" : "fr"
                    )
                  }
                  value={language}
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#64748b]">
                  ▾
                </span>
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#07142f]">Message</span>
              <textarea
                className="min-h-[220px] w-full rounded-xl border border-[#dde5f0] bg-white px-4 py-3 text-sm leading-7 text-[#07142f] shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                disabled={!canEdit}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setPreviewMessage(
                    renderSmsTemplatePreview(event.target.value, language)
                  );
                }}
                ref={textareaRef}
                value={message}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  counter.isLongMessage ? "text-[#b45309]" : "text-[#059669]"
                )}
              >
                <span aria-hidden="true">✓</span>
                <span>{counter.label}</span>
                {counter.isLongMessage ? (
                  <span className="text-[#64748b]">
                    Message long : il pourrait être envoyé en plusieurs SMS.
                  </span>
                ) : null}
              </p>

              <button
                aria-label="Réinitialiser les variables"
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canEdit}
                onClick={handleResetVariables}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 3v6h-6M21 12a9 9 0 0 1-15 6.7L3 21v-6h6" />
                </svg>
                Réinitialiser les variables
              </button>
            </div>

            {errors.length > 0 ? (
              <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-[#991b1b]">
                <ul className="grid gap-1">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]">
                <ul className="grid gap-1">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <SmsVariableChips onInsert={canEdit ? handleInsertVariable : () => undefined} />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dde5f0] bg-white px-5 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2"
                onClick={handlePreview}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  viewBox="0 0 24 24"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Prévisualiser
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563ff] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,255,0.24)] transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canEdit || isPending || isDeleting}
                onClick={handleSave}
                type="button"
              >
                {isPending ? "Enregistrement..." : "Enregistrer le template"}
              </button>
            </div>

            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-5 text-sm font-semibold text-[#b91c1c] transition hover:bg-[#ffe4e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 sm:ml-auto sm:w-auto"
              disabled={
                !canEdit ||
                !currentSelection?.isSaved ||
                isPending ||
                isDeleting
              }
              onClick={handleDelete}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
              {isDeleting ? "Suppression..." : "Supprimer le template"}
            </button>
          </div>
        </section>

        <SmsPreviewPanel previewMessage={previewMessage} />
      </div>
    </>
  );
}
