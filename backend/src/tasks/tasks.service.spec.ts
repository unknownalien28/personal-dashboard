import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../database/prisma.service";

function makePrismaMock() {
  return {
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

describe("TasksService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: TasksService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new TasksService(prisma as any);
  });

  describe("findOne (ownership enforcement)", () => {
    it("returns the task when it exists and belongs to the caller", async () => {
      const task = { id: "t1", userId: "user-1", title: "Test task" };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      const result = await service.findOne("user-1", "t1");
      expect(result).toBe(task);
    });

    it("throws NotFoundException when the task doesn't exist", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne("user-1", "missing")).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException when the task belongs to a different user", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: "t1", userId: "someone-else" });
      await expect(service.findOne("user-1", "t1")).rejects.toThrow(ForbiddenException);
    });
  });

  describe("update", () => {
    it("rejects updating another user's task before ever calling prisma.task.update", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: "t1", userId: "someone-else" });

      await expect(service.update("user-1", "t1", { title: "hacked" } as any)).rejects.toThrow(ForbiddenException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("updates the task when owned by the caller", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: "t1", userId: "user-1" });
      (prisma.task.update as jest.Mock).mockResolvedValue({ id: "t1", userId: "user-1", title: "updated" });

      const result = await service.update("user-1", "t1", { title: "updated" } as any);
      expect(result.title).toBe("updated");
      expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "t1" } }));
    });
  });

  describe("remove", () => {
    it("rejects deleting another user's task before ever calling prisma.task.delete", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: "t1", userId: "someone-else" });
      await expect(service.remove("user-1", "t1")).rejects.toThrow(ForbiddenException);
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it("deletes the task when owned by the caller", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: "t1", userId: "user-1" });
      (prisma.task.delete as jest.Mock).mockResolvedValue(undefined);

      await service.remove("user-1", "t1");
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
    });
  });

  describe("findAll", () => {
    it("scopes the query to the caller's userId and applies optional filters", async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);

      await service.findAll("user-1", { page: 1, limit: 20, completed: true, category: "work" } as any);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1", completed: true, category: "work" } }),
      );
    });
  });
});
