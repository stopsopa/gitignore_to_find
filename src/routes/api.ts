import { Router } from "express";
import { sum } from "../test-examples/add.ts";

const router = Router();

router.get("/sum", (req, res) => {
  const a = parseInt(req.query.a as string);
  const b = parseInt(req.query.b as string);

  if (isNaN(a) || isNaN(b)) {
    return res
      .status(400)
      .json({ error: "Parameters a and b must be numbers" });
  }

  res.json({ result: sum(a, b) });
});

export default router;
