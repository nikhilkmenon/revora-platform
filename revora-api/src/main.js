"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@nestjs/core");
var common_1 = require("@nestjs/common");
var app_module_1 = require("./app.module");
var cookieParser = require("cookie-parser");
var helmet_1 = require("helmet");
var Sentry = require("@sentry/nestjs");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function () {
        var app, port;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // ── Sentry init (before anything else) ──────────────────────────────
                    if (process.env.SENTRY_DSN) {
                        Sentry.init({
                            dsn: process.env.SENTRY_DSN,
                            environment: process.env.NODE_ENV || 'development',
                            tracesSampleRate: 0.2,
                        });
                    }
                    return [4 /*yield*/, core_1.NestFactory.create(app_module_1.AppModule, {
                            bufferLogs: true,
                        })];
                case 1:
                    app = _a.sent();
                    // ── API version prefix ───────────────────────────────────────────────
                    app.setGlobalPrefix('api/v1');
                    // ── Cookie parser (for httpOnly refresh token) ───────────────────────
                    app.use(cookieParser());
                    // ── Helmet — full CSP config ─────────────────────────────────────────
                    app.use((0, helmet_1.default)({
                        contentSecurityPolicy: {
                            directives: {
                                defaultSrc: ["'self'"],
                                scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
                                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                                imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
                                connectSrc: ["'self'", 'https://api.razorpay.com'],
                                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                                frameSrc: ["'self'", 'https://api.razorpay.com'],
                                objectSrc: ["'none'"],
                                upgradeInsecureRequests: [],
                            },
                        },
                        hsts: {
                            maxAge: 31536000,
                            includeSubDomains: true,
                            preload: true,
                        },
                        noSniff: true,
                        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
                    }));
                    // ── CORS — strict whitelist ─────────────────────────────────────────
                    app.enableCors({
                        origin: [
                            process.env.FRONTEND_URL || 'http://localhost:3001',
                            process.env.ADMIN_URL || 'http://localhost:3002',
                        ],
                        credentials: true, // Required for httpOnly cookie refresh tokens
                        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                        allowedHeaders: ['Content-Type', 'Authorization'],
                    });
                    // ── Global validation pipe ───────────────────────────────────────────
                    app.useGlobalPipes(new common_1.ValidationPipe({
                        whitelist: true, // Strip unknown properties
                        forbidNonWhitelisted: true,
                        transform: true,
                    }));
                    port = process.env.PORT || 3000;
                    return [4 /*yield*/, app.listen(port, '0.0.0.0')];
                case 2:
                    _a.sent();
                    console.log("\u2705 REVORA API running on port ".concat(port));
                    console.log("\u2705 Environment: ".concat(process.env.NODE_ENV));
                    console.log("\uD83D\uDD17 API Base: http://localhost:".concat(port, "/api/v1"));
                    return [2 /*return*/];
            }
        });
    });
}
bootstrap();
