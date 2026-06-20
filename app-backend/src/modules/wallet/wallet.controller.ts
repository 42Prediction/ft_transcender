import { Controller, UseGuards, Request, Get, HttpStatus, HttpException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WalletService } from "./wallet.service";

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {

    constructor(private readonly walletService: WalletService) { }

    @Get('me')
    async getMyWallet(@Request() req) {
        try {
            const wallet = await this.walletService.getMyWallet(req.user.id);
            return {
                success: true,
                statusCode: HttpStatus.OK,
                data: wallet,
                error: null,
            }
        } catch (error) {
            const statusCode =
                error instanceof HttpException
                    ? error.getStatus()
                    : HttpStatus.INTERNAL_SERVER_ERROR;

            return {
                success: false,
                statusCode,
                data: null,
                error: error instanceof Error ? error.message : 'Unexpected error',
            };
        }
    }

    @Get('me/transactions')
    async getMyTransactions(@Request() req) {
        try {
            const transactions = await this.walletService.getMyTransactions(req.user.id);
            return {
                success: true,
                statusCode: HttpStatus.OK,
                data: transactions,
                error: null,
            }
        } catch (error) {
            const statusCode =
                error instanceof HttpException
                    ? error.getStatus()
                    : HttpStatus.INTERNAL_SERVER_ERROR;

            return {
                success: false,
                statusCode,
                data: null,
                error: error instanceof Error ? error.message : 'Unexpected error',
            };
        }
    }
}