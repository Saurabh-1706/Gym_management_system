"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var bcrypt_1 = require("bcrypt");
var User_1 = require("../models/User");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env.local") });
// Runtime check
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env. Make sure .env is at project root and contains a valid MongoDB URI.");
}
// 🔹 Tell TypeScript explicitly this is string
var mongoUri = MONGODB_URI;
function seedUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var users, _i, users_1, u, existing, hashedPassword, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, 10, 12]);
                    return [4 /*yield*/, mongoose_1.default.connect(mongoUri)];
                case 1:
                    _a.sent();
                    console.log("✅ Connected to MongoDB");
                    users = [
                        { email: "saurabhmojad1706@gmail.com", name: "Saurabh", password: "S@urabh@1706" },
                        { email: "user2@example.com", name: "User 2", password: "password2" },
                        { email: "user3@example.com", name: "User 3", password: "password3" },
                        { email: "user4@example.com", name: "User 4", password: "password4" },
                        { email: "user5@example.com", name: "User 5", password: "password5" },
                        { email: "user6@example.com", name: "User 6", password: "password6" },
                        { email: "user7@example.com", name: "User 7", password: "password7" },
                        { email: "user8@example.com", name: "User 8", password: "password8" },
                        { email: "user9@example.com", name: "User 9", password: "password9" },
                        { email: "user10@example.com", name: "User 10", password: "password10" },
                    ];
                    _i = 0, users_1 = users;
                    _a.label = 2;
                case 2:
                    if (!(_i < users_1.length)) return [3 /*break*/, 8];
                    u = users_1[_i];
                    return [4 /*yield*/, User_1.default.findOne({ email: u.email })];
                case 3:
                    existing = _a.sent();
                    if (!!existing) return [3 /*break*/, 6];
                    return [4 /*yield*/, bcrypt_1.default.hash(u.password, 10)];
                case 4:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, User_1.default.create(__assign(__assign({}, u), { password: hashedPassword }))];
                case 5:
                    _a.sent();
                    console.log("\u2705 Created user: ".concat(u.email));
                    return [3 /*break*/, 7];
                case 6:
                    console.log("\u2139\uFE0F User already exists: ".concat(u.email));
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("🎉 Seeding done!");
                    return [3 /*break*/, 12];
                case 9:
                    err_1 = _a.sent();
                    console.error("❌ Error seeding users:", err_1);
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 11:
                    _a.sent();
                    process.exit(0);
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
}
seedUsers();
