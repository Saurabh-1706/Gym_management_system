"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode = __importStar(require("qrcode-terminal"));
const mongoose = __importStar(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const cron = __importStar(require("node-cron"));
dotenv.config();
const memberSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    endDate: Date,
});
const Member = mongoose.model("Member", memberSchema);
// -------------------------
// WhatsApp Client
// -------------------------
const client = new whatsapp_web_js_1.Client({
    authStrategy: new whatsapp_web_js_1.LocalAuth({ dataPath: "./session" }),
});
client.on("qr", (qr) => {
    console.log("📱 Scan this QR code from WhatsApp:");
    qrcode.generate(qr, { small: true });
});
client.on("ready", () => {
    console.log("✅ WhatsApp Client is ready!");
});
// -------------------------
// Send Message
// -------------------------
async function sendMessage(phone, message) {
    try {
        await client.sendMessage(`${phone}@c.us`, message);
        console.log(`📤 Sent to ${phone}: ${message}`);
    }
    catch (err) {
        console.error("❌ Error sending message:", err);
    }
}
// -------------------------
// Automatic Reminder
// -------------------------
async function sendExpiryReminders() {
    const today = new Date();
    const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringMembers = await Member.find({
        endDate: { $lte: threeDays, $gte: today },
    });
    for (const member of expiringMembers) {
        const msg = `Hi ${member.name}, your gym membership expires on ${member.endDate.toDateString()}. Please renew soon 💪`;
        await sendMessage(member.mobile, msg);
        await new Promise((r) => setTimeout(r, 7000)); // 7 sec delay
    }
    console.log(`✅ Sent reminders to ${expiringMembers.length} members`);
}
// -------------------------
// Cron: Daily 9AM
// -------------------------
cron.schedule("0 9 * * *", () => {
    console.log("⏰ Running daily reminders...");
    sendExpiryReminders();
});
// -------------------------
// Manual Trigger
// -------------------------
client.on("message", async (message) => {
    if (message.body.toLowerCase() === "!remind") {
        await sendExpiryReminders();
        message.reply("✅ Sent automatic reminders to expiring members.");
    }
});
// -------------------------
// Start Bot
// -------------------------
async function startBot() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    client.initialize();
}
startBot();
