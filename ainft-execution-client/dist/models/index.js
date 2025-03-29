"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptEnhancementModel = exports.ExecutionClientStateModel = exports.MessageModel = exports.PromptEnhancement = exports.ExecutionClientState = exports.Message = void 0;
const typegoose_1 = require("@typegoose/typegoose");
/**
 * Message model
 */
class Message {
}
exports.Message = Message;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "aiNft", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "aiCharacter", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "sender", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Message.prototype, "response", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "answered", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Message.prototype, "answeredAt", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
/**
 * Execution client state model
 */
class ExecutionClientState {
}
exports.ExecutionClientState = ExecutionClientState;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], ExecutionClientState.prototype, "aiNft", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0 }),
    __metadata("design:type", Number)
], ExecutionClientState.prototype, "totalProcessed", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0 }),
    __metadata("design:type", Number)
], ExecutionClientState.prototype, "totalCompute", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0 }),
    __metadata("design:type", Number)
], ExecutionClientState.prototype, "totalStaked", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: true }),
    __metadata("design:type", Boolean)
], ExecutionClientState.prototype, "active", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String], default: ['text'] }),
    __metadata("design:type", Array)
], ExecutionClientState.prototype, "supportedMessageTypes", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: Date.now }),
    __metadata("design:type", Date)
], ExecutionClientState.prototype, "lastUpdated", void 0);
/**
 * Prompt enhancement model
 */
class PromptEnhancement {
}
exports.PromptEnhancement = PromptEnhancement;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], PromptEnhancement.prototype, "messageId", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], PromptEnhancement.prototype, "originalPrompt", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], PromptEnhancement.prototype, "enhancedPrompt", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String] }),
    __metadata("design:type", Array)
], PromptEnhancement.prototype, "enhancers", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: Date.now }),
    __metadata("design:type", Date)
], PromptEnhancement.prototype, "createdAt", void 0);
// Create models
exports.MessageModel = (0, typegoose_1.getModelForClass)(Message);
exports.ExecutionClientStateModel = (0, typegoose_1.getModelForClass)(ExecutionClientState);
exports.PromptEnhancementModel = (0, typegoose_1.getModelForClass)(PromptEnhancement);
