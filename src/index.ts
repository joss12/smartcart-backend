import app from "./server";
import "dotenv/config";

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
