import { AppError } from "../../src/utils/app-error";

describe("AppError",()=>{it("keeps safe structured error fields",()=>{const error=new AppError(403,"FORBIDDEN","Forbidden");expect(error.status).toBe(403);expect(error.code).toBe("FORBIDDEN");expect(error.details).toEqual({});});});
