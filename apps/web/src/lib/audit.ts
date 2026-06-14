import { db } from "@/lib/db";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "CANCEL" | "RESCHEDULE";
type AuditEntity = "APPOINTMENT" | "SERVICE" | "STAFF" | "CUSTOMER" | "SALON" | "SUBSCRIPTION" | "HOLIDAY";

/**
 * Logs an action to the audit trail.
 */
export async function logAudit(params: {
  salonId: string;
  userId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        salonId: params.salonId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: (params.metadata || {}) as any,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Never let audit logging crash the main flow
    console.error("Audit log error:", error);
  }
}
