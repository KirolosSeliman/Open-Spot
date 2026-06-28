export type AuditCategory =
  | "sms"
  | "company"
  | "billing"
  | "compliance"
  | "client"
  | "security"
  | "system"
  | "view"
  | "other";

export type AuditImportance = "critical" | "normal" | "view";

export type AuditCategoryFilter = AuditCategory | "all";
export type AuditImportanceFilter = AuditImportance | "all";

const auditActionLabels: Record<string, string> = {
  "admin.audit.viewed": "Journal d'audit consulté",
  "admin.compliance.viewed": "Conformité consultée",
  "admin.organization.viewed": "Fiche compagnie consultée",
  "admin.organization.overview_viewed": "Vue d'ensemble compagnie consultée",
  "admin.organization.sms_viewed": "Page SMS consultée",
  "admin.organization.sms_paused": "SMS mis en pause",
  "admin.organization.sms_resumed": "SMS repris",
  "admin.organization.sms_activated": "SMS activé",
  "admin.organization.sms_sender_paused": "Expéditeur SMS mis en pause",
  "admin.organization.sms_sender_blocked": "Expéditeur SMS bloqué",
  "admin.organization.sms_subaccount_created": "Sous-compte SMS créé",
  "admin.organization.sms_subaccount_connected": "Sous-compte SMS connecté",
  "admin.organization.sms_sender_synced": "Expéditeur SMS synchronisé",
  "admin.organization.sms_number_assigned": "Numéro SMS assigné",
  "admin.organization.sms_messaging_service_updated":
    "Service de messagerie SMS mis à jour",
  "admin.organization.sms_messaging_service_attach_failed":
    "Échec d'attachement au service de messagerie SMS",
  "admin.organization.sms_webhooks_configured": "Webhooks SMS configurés",
  "admin.organization.sms_test_sent": "SMS test envoyé",
  "admin.organization.sms_compliance_approved": "Conformité SMS approuvée",
  "admin.organization.disabled": "Compagnie désactivée",
  "admin.organization.reactivated": "Compagnie réactivée",
  "admin.organization.archived": "Compagnie archivée",
  "admin.organization.unarchived": "Compagnie désarchivée",
  "admin.organization.support_status_updated": "Statut support mis à jour",
  "admin.organization.admin_note_updated": "Note admin mise à jour",
  "admin.organization.internal_test_updated": "Marquage test interne mis à jour",
  "admin.organization.billing_terms_updated": "Conditions de facturation mises à jour",
  "admin.organization.manual_billing_plan_updated": "Plan de facturation mis à jour",
  "admin.organization.business_info_updated": "Informations commerciales mises à jour",
  "admin.organization.health_check_ran": "Vérification santé exécutée",
  "admin.manager_mode.started": "Mode gestionnaire démarré",
  "admin.manager_mode.ended": "Mode gestionnaire terminé",
  "admin.manager_session.ended_by_admin": "Session gestionnaire terminée par admin",
  "admin.billing.payment_marked_received": "Paiement marqué reçu",
  "admin.billing.payment_reminder_sent": "Rappel de paiement envoyé",
  "billing.payment_reminder_sent": "Rappel de paiement envoyé",
  "platform_admin.bootstrap_created": "Compte administrateur initialisé",
  "sms.opt_out.received": "Désabonnement SMS reçu",
  "sms.positive_reply.received": "Réponse positive reçue",
  "sms.twilio_status.received": "Statut Twilio reçu",
  "sms.consent_request.sent": "Demande de consentement SMS envoyée",
  "sms.consent.opted_in_by_reply": "Consentement SMS accordé par réponse",
  "sms.consent.declined_by_reply": "Consentement SMS refusé par réponse",
  "sms.inbound.linked": "SMS entrant lié",
  "opening.created_from_sms_cancellation": "Créneau créé après annulation SMS",
  "appointment.sms_cancelled": "Rendez-vous annulé par SMS",
  "appointment.sms_confirmed": "Rendez-vous confirmé par SMS",
  "call_request.invitation_resent": "Invitation renvoyée",
  "owner_invitation_resent": "Invitation propriétaire renvoyée"
};

const criticalActionPatterns = [
  /sms_(activated|paused|resumed|sender_paused|sender_blocked|compliance_approved|webhooks_configured)/,
  /organization\.(disabled|reactivated|archived|unarchived|pause_sms|resume_sms|disable|archive)/,
  /billing\.(payment_reminder_sent|updated)/,
  /payment_reminder_sent/,
  /manual_billing_plan_updated/,
  /billing_terms_updated/,
  /opt_out/,
  /webhook.*(fail|error|security)/i,
  /manager_mode\.(started|ended)/,
  /manager_session\.end/,
  /invitation.*(sent|resent)/,
  /session\.(end|ended|revoked)/,
  /auth\.(logout|revoke)/,
  /compliance.*(approved|changed|updated)/,
  /consent.*(declined|opted_out)/,
  /sms_sender_blocked/,
  /sms_compliance_approved/
];

export function isAuditViewAction(action: string): boolean {
  return action.endsWith("_viewed") || action.endsWith(".viewed");
}

export function getAuditCategory(action: string): AuditCategory {
  const normalized = action.toLowerCase();

  if (
    /compliance|consent|opt_out|opt-out|stop\b/.test(normalized) &&
    !/_viewed|\.viewed$/.test(normalized)
  ) {
    return "compliance";
  }

  if (/billing|payment|invoice|subscription/.test(normalized)) {
    return "billing";
  }

  if (/auth|session|manager_mode|manager_session|permission|security/.test(normalized)) {
    return "security";
  }

  if (/sms|twilio|webhook|opening|appointment/.test(normalized)) {
    return "sms";
  }

  if (/organization|company|business/.test(normalized)) {
    return "company";
  }

  if (/customer|call_request|owner_invitation|client/.test(normalized)) {
    return "client";
  }

  if (/bootstrap|health_check|platform_admin/.test(normalized)) {
    return "system";
  }

  if (isAuditViewAction(action)) {
    return "view";
  }

  return "other";
}

export function getAuditImportance(action: string): AuditImportance {
  if (isAuditViewAction(action)) {
    return "view";
  }

  const normalized = action.toLowerCase();

  if (criticalActionPatterns.some((pattern) => pattern.test(normalized))) {
    return "critical";
  }

  return "normal";
}

function humanizeAuditActionFallback(action: string) {
  return action
    .replace(/^[^.]+\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function formatAuditActionLabel(action: string): string {
  if (auditActionLabels[action]) {
    return auditActionLabels[action];
  }

  return humanizeAuditActionFallback(action);
}

export function getAuditCategoryLabel(category: AuditCategory): string {
  const labels: Record<AuditCategory, string> = {
    sms: "SMS",
    company: "Compagnie",
    billing: "Billing",
    compliance: "Conformité",
    client: "Client",
    security: "Sécurité",
    system: "Système",
    view: "Consultation",
    other: "Autre"
  };

  return labels[category];
}

export function getAuditImportanceLabel(importance: AuditImportance): string {
  const labels: Record<AuditImportance, string> = {
    critical: "Critique",
    normal: "Normal",
    view: "Consultation"
  };

  return labels[importance];
}

export function maskAuditEntityId(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const trimmed = value.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}…${trimmed.slice(-4)}`;
}

export function isSmsOrComplianceCategory(category: AuditCategory): boolean {
  return category === "sms" || category === "compliance";
}

const sensitiveMetadataKeyPattern =
  /(password|secret|token|api[_-]?key|authorization|credential|private)/i;

export function sanitizeAuditMetadataForDisplay(
  metadata: unknown
): unknown {
  if (metadata === null || metadata === undefined) {
    return metadata;
  }

  if (Array.isArray(metadata)) {
    return metadata.map((entry) => sanitizeAuditMetadataForDisplay(entry));
  }

  if (typeof metadata !== "object") {
    return metadata;
  }

  return Object.fromEntries(
    Object.entries(metadata as Record<string, unknown>).map(([key, value]) => {
      if (sensitiveMetadataKeyPattern.test(key)) {
        return [key, "[redacted]"];
      }

      return [key, sanitizeAuditMetadataForDisplay(value)];
    })
  );
}
