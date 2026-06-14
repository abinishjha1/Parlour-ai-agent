import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class AppointmentRepository {
  static async findOverlapping(staffId: string, startTime: Date, endTime: Date) {
    return db.appointment.findFirst({
      where: {
        staffId,
        status: {
          notIn: ["CANCELLED"],
        },
        OR: [
          {
            // Existing appointment starts inside the requested slot
            startTime: {
              gte: startTime,
              lt: endTime,
            },
          },
          {
            // Existing appointment ends inside the requested slot
            endTime: {
              gt: startTime,
              lte: endTime,
            },
          },
          {
            // Existing appointment completely encompasses requested slot
            startTime: {
              lte: startTime,
            },
            endTime: {
              gte: endTime,
            },
          },
        ],
      },
    });
  }

  static async create(data: Prisma.AppointmentUncheckedCreateInput) {
    return db.appointment.create({
      data,
    });
  }

  static async getStaffSchedule(staffId: string, startDate: Date, endDate: Date) {
    return db.appointment.findMany({
      where: {
        staffId,
        status: {
          notIn: ["CANCELLED"],
        },
        startTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }
}
