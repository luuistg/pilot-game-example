import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface LaunchContext {
    matchId: string | null;
    playerId: string | null;
    player2Id: string | null;
    rawParams: Record<string, string>;
}

export interface SubmitGameResultInput {
    matchId: string;
    playerId: string;
    score: number;
    pointsDelta?: number;
    rpcName?: string;
    fallbackTable?: string;
}

export interface SubmitGameResultOutput {
    ok: boolean;
    conflict: boolean;
    source: 'rpc' | 'table' | 'none';
    error?: PostgrestError | Error | null;
}

function getFirstParam(params: URLSearchParams, keys: string[]): string | null {
    for (const key of keys) {
        const value = params.get(key);
        if (value && value.trim().length > 0) {
            return value.trim();
        }
    }

    return null;
}

function isConflictError(error: PostgrestError): boolean {
    return (
        error.code === '23505' ||
        error.code === '409' ||
        /conflict|duplicate|already/i.test(error.message ?? '')
    );
}

export function getLaunchContextFromUrl(search: string = window.location.search): LaunchContext {
    const params = new URLSearchParams(search);

    const context: LaunchContext = {
        matchId: getFirstParam(params, ['matchId', 'match_id', 'match']),
        playerId: getFirstParam(params, ['player', 'userId', 'playerId', 'player1', 'player_1']),
        player2Id: getFirstParam(params, ['player2', 'player2Id', 'player_2']),
        rawParams: Object.fromEntries(params.entries())
    };

    console.log('Launch context recibido:', context);
    return context;
}

async function submitByRpc(input: SubmitGameResultInput): Promise<SubmitGameResultOutput> {
    const rpcName = input.rpcName ?? 'register_final_result';
    const pointsDelta = input.pointsDelta ?? 10;

    const payloadVariants: Record<string, unknown>[] = [
        {
            p_match_id: input.matchId,
            p_winner_id: input.playerId,
            p_score_p1: input.score,
            p_points_delta: pointsDelta
        },
        {
            p_match_id: input.matchId,
            p_player_id: input.playerId,
            p_score: input.score,
            p_points_delta: pointsDelta
        },
        {
            match_id: input.matchId,
            player_id: input.playerId,
            score: input.score,
            points_delta: pointsDelta
        }
    ];

    let lastError: PostgrestError | null = null;

    for (const payload of payloadVariants) {
        const { error } = await supabase.rpc(rpcName, payload);

        if (!error) {
            return {
                ok: true,
                conflict: false,
                source: 'rpc'
            };
        }

        if (isConflictError(error)) {
            return {
                ok: true,
                conflict: true,
                source: 'rpc',
                error
            };
        }

        lastError = error;
        console.warn('RPC falló con firma de payload', {
            rpcName,
            payload,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
    }

    return {
        ok: false,
        conflict: false,
        source: 'none',
        error: lastError
    };
}

async function submitByTable(input: SubmitGameResultInput): Promise<SubmitGameResultOutput> {
    const fallbackTable = input.fallbackTable ?? 'match_results';
    const pointsDelta = input.pointsDelta ?? 10;

    const { error } = await supabase.from(fallbackTable).insert({
        match_id: input.matchId,
        player_id: input.playerId,
        score: input.score,
        points_delta: pointsDelta
    });

    if (!error) {
        return {
            ok: true,
            conflict: false,
            source: 'table'
        };
    }

    if (isConflictError(error)) {
        return {
            ok: true,
            conflict: true,
            source: 'table',
            error
        };
    }

    return {
        ok: false,
        conflict: false,
        source: 'none',
        error
    };
}

export async function submitGameResult(input: SubmitGameResultInput): Promise<SubmitGameResultOutput> {
    if (!input.matchId || !input.playerId) {
        return {
            ok: false,
            conflict: false,
            source: 'none',
            error: new Error('matchId y playerId son obligatorios')
        };
    }

    const rpcResult = await submitByRpc(input);
    if (rpcResult.ok) {
        return rpcResult;
    }

    const tableResult = await submitByTable(input);
    if (tableResult.ok) {
        return tableResult;
    }

    return tableResult;
}
