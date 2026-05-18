"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var KycController = function () {
    var _classDecorators = [(0, common_1.Controller)('kyc'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _myStatus_decorators;
    var _queue_decorators;
    var KycController = _classThis = /** @class */ (function () {
        function KycController_1(kycService) {
            this.kycService = (__runInitializers(this, _instanceExtraInitializers), kycService);
        }
        KycController_1.prototype.myStatus = function (userId) {
            return this.kycService.getStatus(userId);
        };
        KycController_1.prototype.queue = function () {
            return this.kycService.getQueue();
        };
        return KycController_1;
    }());
    __setFunctionName(_classThis, "KycController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _myStatus_decorators = [(0, common_1.Get)('status'), (0, roles_decorator_1.Roles)('DESIGNER'), (0, common_1.UseGuards)(roles_guard_1.RolesGuard)];
        _queue_decorators = [(0, common_1.Get)('queue'), (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'), (0, common_1.UseGuards)(roles_guard_1.RolesGuard)];
        __esDecorate(_classThis, null, _myStatus_decorators, { kind: "method", name: "myStatus", static: false, private: false, access: { has: function (obj) { return "myStatus" in obj; }, get: function (obj) { return obj.myStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _queue_decorators, { kind: "method", name: "queue", static: false, private: false, access: { has: function (obj) { return "queue" in obj; }, get: function (obj) { return obj.queue; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        KycController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return KycController = _classThis;
}();
exports.KycController = KycController;
