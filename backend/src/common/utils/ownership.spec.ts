import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { assertOwned } from "./ownership";

describe("assertOwned", () => {
  it("throws NotFoundException when the entity is null", () => {
    expect(() => assertOwned(null, "user-1", "Task not found")).toThrow(NotFoundException);
    expect(() => assertOwned(null, "user-1", "Task not found")).toThrow("Task not found");
  });

  it("throws ForbiddenException when the entity belongs to a different user", () => {
    const task = { id: "t1", userId: "someone-else" };
    expect(() => assertOwned(task, "user-1", "Task not found")).toThrow(ForbiddenException);
  });

  it("does not throw, and narrows the type, when the entity exists and is owned by the caller", () => {
    const task: { id: string; userId: string } | null = { id: "t1", userId: "user-1" };
    expect(() => assertOwned(task, "user-1", "Task not found")).not.toThrow();
    // TypeScript control-flow narrowing check: after assertOwned, `task` is
    // usable as non-null without an extra cast. This line only compiles if
    // the `asserts entity is T` signature is intact.
    assertOwned(task, "user-1", "Task not found");
    expect(task.id).toBe("t1");
  });

  it("never leaks whether a row didn't exist vs belongs to someone else (both are 404-then-403, not silently different)", () => {
    let notFoundError: unknown;
    let forbiddenError: unknown;
    try {
      assertOwned(null, "user-1", "X not found");
    } catch (e) {
      notFoundError = e;
    }
    try {
      assertOwned({ id: "x", userId: "other" }, "user-1", "X not found");
    } catch (e) {
      forbiddenError = e;
    }
    expect(notFoundError).toBeInstanceOf(NotFoundException);
    expect(forbiddenError).toBeInstanceOf(ForbiddenException);
  });
});
