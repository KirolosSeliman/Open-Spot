import type { InboundSmsClassification } from "@/lib/sms/inbound";
import type {
  OpeningResponseCustomer,
  OpeningResponseGroup,
  OpeningResponsesFilters
} from "@/lib/dashboard/operations-data";

export type ResponsesTab = "openings" | "appointments";

export type OpeningStatusFilter = "all" | "filled" | "awaiting";

export type ResponsesSearchParams = {
  tab?: string;
  range?: string;
  serviceId?: string;
  status?: string;
  q?: string;
  page?: string;
  pageSize?: string;
  calInterval?: string;
  calDate?: string;
  notice?: string;
  validationError?: string;
};

export type ExtendedOpeningFilters = OpeningResponsesFilters & {
  status: OpeningStatusFilter;
  page: number;
  pageSize: number;
};

export type CalendarInterval = "1d" | "2d" | "1w" | "1m";

export type AppointmentCalendarItem = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerLanguage: string;
  serviceId: string | null;
  serviceName: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  status: string;
  confirmationStatus: string;
  notes: string | null;
  reminderStatus: string;
  confirmationRequestEnabled: boolean;
  smsSent: boolean;
  smsSentAt: string | null;
  smsBody: string | null;
  smsDeliveryStatus: string | null;
  inboundBody: string | null;
  inboundReceivedAt: string | null;
  inboundClassification: InboundSmsClassification | null;
  relatedOpeningId: string | null;
};

export type PaginatedOpeningGroups = {
  items: OpeningResponseGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ServicePriceLookup = Map<
  string,
  { name: string; normalPriceCents: number | null }
>;

export type OpeningGroupWithValue = OpeningResponseGroup & {
  recoveredValueCents: number;
};

export type { OpeningResponseCustomer, OpeningResponseGroup };
