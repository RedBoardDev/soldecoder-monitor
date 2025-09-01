/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import type { LpAgentPosition, LpAgentResponse, WalletPosition } from '../../discord/types/lpagent.types';

export class LpAgentMapper {
  public static toWalletPositions(lpAgentResponse: LpAgentResponse): WalletPosition[] {
    if (!lpAgentResponse?.data || !Array.isArray(lpAgentResponse.data)) {
      return [];
    }

    return lpAgentResponse.data.map((position) => LpAgentMapper.toWalletPosition(position));
  }

  public static toWalletPosition(lpAgentPosition: LpAgentPosition): WalletPosition {
    return {
      status: lpAgentPosition.status,
      token0: lpAgentPosition.token0,
      token1: lpAgentPosition.token1,
      pool: lpAgentPosition.pool,
      pairName: lpAgentPosition.pairName,
      currentValue: lpAgentPosition.currentValue,
      inRange: lpAgentPosition.inRange,
      pnl: lpAgentPosition.pnl,
      valueNative: lpAgentPosition.valueNative,
    };
  }
}
