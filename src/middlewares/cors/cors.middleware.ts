import cors from "cors";

// Allow all origins (for development or open API)
const corsMiddleware = cors({
  origin: true,
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD,FIND",
  credentials: true,
});

export default corsMiddleware;
