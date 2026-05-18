"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
var common_1 = require("@nestjs/common");
var crypto = require("crypto");
var razorpay_1 = require("razorpay");
var PaymentsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PaymentsService = _classThis = /** @class */ (function () {
        function PaymentsService_1(prisma, config) {
            this.prisma = prisma;
            this.config = config;
            this.logger = new common_1.Logger(PaymentsService.name);
            this.razorpay = new razorpay_1.default({
                key_id: this.config.get('RAZORPAY_KEY_ID'),
                key_secret: this.config.get('RAZORPAY_KEY_SECRET'),
            });
        }
        // ── Create Razorpay order ────────────────────────────────────────────
        PaymentsService_1.prototype.createOrder = function (dto, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var products, missing, total, rzpOrder, err_1, order;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(dto.items.map(function (item) {
                                return _this.prisma.product.findUnique({ where: { id: item.productId } });
                            }))];
                        case 1:
                            products = _a.sent();
                            missing = products.findIndex(function (p) { return !p; });
                            if (missing !== -1)
                                throw new common_1.NotFoundException("Product ".concat(dto.items[missing].productId, " not found"));
                            total = products.reduce(function (sum, product, i) {
                                return sum + product.price * dto.items[i].quantity;
                            }, 0);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.razorpay.orders.create({
                                    amount: Math.round(total * 100),
                                    currency: 'INR',
                                    receipt: "rcpt_".concat(Date.now()),
                                    notes: { userId: userId },
                                })];
                        case 3:
                            rzpOrder = _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            err_1 = _a.sent();
                            this.logger.error('Razorpay order creation failed', err_1);
                            throw new common_1.InternalServerErrorException('Payment gateway error');
                        case 5: return [4 /*yield*/, this.prisma.order.create({
                                data: {
                                    userId: userId,
                                    razorpayOrderId: rzpOrder.id,
                                    total: total,
                                    address: dto.address,
                                    status: 'PENDING',
                                    items: {
                                        create: dto.items.map(function (item, i) { return ({
                                            productId: item.productId,
                                            quantity: item.quantity,
                                            price: products[i].price,
                                        }); }),
                                    },
                                    payment: {
                                        create: {
                                            amount: total,
                                            currency: 'INR',
                                            status: 'PENDING',
                                        },
                                    },
                                },
                                include: { items: true, payment: true },
                            })];
                        case 6:
                            order = _a.sent();
                            return [2 /*return*/, {
                                    orderId: order.id,
                                    razorpayOrderId: rzpOrder.id,
                                    amount: rzpOrder.amount,
                                    currency: rzpOrder.currency,
                                    key: this.config.get('RAZORPAY_KEY_ID'),
                                }];
                    }
                });
            });
        };
        // ── Handle Razorpay webhook ──────────────────────────────────────────
        PaymentsService_1.prototype.handleWebhook = function (rawBody, signature) {
            return __awaiter(this, void 0, void 0, function () {
                var isValid, payload, event, payment, payment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            isValid = this.verifyWebhookSignature(rawBody, signature);
                            if (!isValid) {
                                this.logger.warn('⚠️ Invalid Razorpay webhook signature — possible attack');
                                throw new common_1.UnauthorizedException('Invalid webhook signature');
                            }
                            payload = JSON.parse(rawBody);
                            event = payload.event;
                            this.logger.log("\uD83D\uDCE6 Razorpay webhook event: ".concat(event));
                            if (!(event === 'payment.captured')) return [3 /*break*/, 2];
                            payment = payload.payload.payment.entity;
                            return [4 /*yield*/, this.handlePaymentCaptured(payment)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            if (!(event === 'payment.failed')) return [3 /*break*/, 4];
                            payment = payload.payload.payment.entity;
                            return [4 /*yield*/, this.handlePaymentFailed(payment)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        // ── Verify HMAC signature ────────────────────────────────────────────
        PaymentsService_1.prototype.verifyWebhookSignature = function (body, signature) {
            var secret = this.config.get('RAZORPAY_WEBHOOK_SECRET');
            if (!secret || !signature)
                return false;
            var expected = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');
            try {
                return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
            }
            catch (_a) {
                return false;
            }
        };
        // ── Payment captured — mark order as CONFIRMED ───────────────────────
        PaymentsService_1.prototype.handlePaymentCaptured = function (rzpPayment) {
            return __awaiter(this, void 0, void 0, function () {
                var order;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.order.findFirst({
                                where: { razorpayOrderId: rzpPayment.order_id },
                                include: { payment: true },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order) {
                                this.logger.warn("Order not found for Razorpay order ".concat(rzpPayment.order_id));
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.prisma.order.update({
                                    where: { id: order.id },
                                    data: { status: 'CONFIRMED' },
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.payment.update({
                                    where: { orderId: order.id },
                                    data: {
                                        razorpayPayId: rzpPayment.id,
                                        status: 'CAPTURED',
                                        webhookVerified: true,
                                    },
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.orderTracking.create({
                                    data: {
                                        orderId: order.id,
                                        status: 'CONFIRMED',
                                        message: 'Payment confirmed by Razorpay',
                                    },
                                })];
                        case 4:
                            _a.sent();
                            this.logger.log("\u2705 Order ".concat(order.id, " CONFIRMED \u2014 Razorpay payment ").concat(rzpPayment.id));
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── Payment failed ───────────────────────────────────────────────────
        PaymentsService_1.prototype.handlePaymentFailed = function (rzpPayment) {
            return __awaiter(this, void 0, void 0, function () {
                var order;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.order.findFirst({
                                where: { razorpayOrderId: rzpPayment.order_id },
                            })];
                        case 1:
                            order = _a.sent();
                            if (!order)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.prisma.order.update({
                                    where: { id: order.id },
                                    data: { status: 'CANCELLED' },
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.payment.update({
                                    where: { orderId: order.id },
                                    data: { status: 'FAILED', webhookVerified: true },
                                })];
                        case 3:
                            _a.sent();
                            this.logger.warn("\u274C Payment failed for order ".concat(order.id));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return PaymentsService_1;
    }());
    __setFunctionName(_classThis, "PaymentsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsService = _classThis;
}();
exports.PaymentsService = PaymentsService;
