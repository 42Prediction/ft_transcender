import { Controller, UseGuards, Request, Get, HttpStatus, HttpException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WalletService } from "./wallet.service";
import { errorResponse, successResponse } from "../../shared/helper/api-response.helper";
import { Wallet } from "./entities/wallet.entity";
import { WalletResponseDto } from "./dto/wallet-response.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {

    constructor(private readonly walletService: WalletService) { }

    @Get('me')
    async getMyWallet(@Request() req) {
        try {
            const wallet = await this.walletService.getMyWallet(req.user.id);
            return successResponse<WalletResponseDto>(HttpStatus.OK, wallet);
        } catch (error) {
            return errorResponse(error);
        }
    }

    @Get('me/transactions')
    async getMyTransactions(@Request() req) {
        try {
            const transactions = await this.walletService.getMyTransactions(req.user.id);
            return successResponse<TransactionResponseDto[]>(HttpStatus.OK, transactions);
        } catch (error) {
            return errorResponse(error);
        }
    }
}