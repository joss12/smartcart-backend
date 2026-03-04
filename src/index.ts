import app from "./server";
import "dotenv/config";

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "smartcart-api",
    time: new Date().toISOString(),
  });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
