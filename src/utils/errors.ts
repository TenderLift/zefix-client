/**
 * Error handling utilities for ZEFIX API responses
 */

/**
 * Custom error class for ZEFIX API errors
 */
export class ZefixError extends Error {
	constructor(
		message: string,
		public readonly status?: number,
		public readonly code?: string,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = 'ZefixError';
		Object.setPrototypeOf(this, ZefixError.prototype);
	}

	static fromResponse(response: {
		status: number;
		statusText: string;
		error?: unknown;
	}): ZefixError {
		const message = `ZEFIX API Error: ${response.status} ${response.statusText}`;
		return new ZefixError(message, response.status, undefined, response.error);
	}
}

/**
 * Type for API response with data and error
 */
export type ApiResponse<T> = {
	data?: T;
	error?: unknown;
	response: {
		status: number;
		statusText: string;
		ok: boolean;
	};
};

/**
 * Ensure API response is successful and return data
 * @throws {ZefixError} if response has error or no data
 */
export async function ensureOk<T>(
	response: ApiResponse<T> | Promise<ApiResponse<T>>,
): Promise<T> {
	const result = await response;

	if (result.error) {
		throw ZefixError.fromResponse({
			status: result.response.status,
			statusText: result.response.statusText,
			error: result.error,
		});
	}

	if (!result.data) {
		throw new ZefixError(
			'No data in response',
			result.response.status,
			'NO_DATA',
		);
	}

	return result.data;
}
