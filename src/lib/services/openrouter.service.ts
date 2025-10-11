import type {
  OpenRouterConfig,
  ChatOptions,
  ChatResponse,
  Message,
  OpenRouterParams,
  ResponseFormat,
} from "../../types";

/**
 * Error codes for OpenRouter service
 */
export enum OpenRouterErrorCode {
  MISSING_API_KEY = "MISSING_API_KEY",
  INVALID_MODEL = "INVALID_MODEL",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  TIMEOUT = "TIMEOUT",
  UNSUPPORTED_FEATURE = "UNSUPPORTED_FEATURE",
  INVALID_JSON_RESPONSE = "INVALID_JSON_RESPONSE",
  SCHEMA_VALIDATION_FAILED = "SCHEMA_VALIDATION_FAILED",
}

/**
 * Custom error class for OpenRouter operations
 */
export class OpenRouterError extends Error {
  constructor(
    public code: OpenRouterErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * OpenRouter API service for chat completions with structured outputs
 * Provides unified interface for LLM chat requests with JSON schema enforcement
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultParams: Partial<OpenRouterParams>;

  /**
   * Maximum number of retry attempts for transient errors
   */
  private static readonly MAX_RETRIES = 3;

  /**
   * Base delay in milliseconds for exponential backoff
   */
  private static readonly BASE_RETRY_DELAY_MS = 1000;

  /**
   * Default OpenRouter API base URL
   */
  private static readonly DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

  /**
   * Default model to use for chat completions
   */
  private static readonly DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free";

  constructor(config: OpenRouterConfig) {
    // Guard clause: validate API key
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new OpenRouterError(OpenRouterErrorCode.MISSING_API_KEY, "OpenRouter API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? OpenRouterService.DEFAULT_BASE_URL;
    this.defaultModel = config.defaultModel ?? OpenRouterService.DEFAULT_MODEL;
    this.defaultParams = config.defaultParams ?? {};
  }

  /**
   * Creates a new service instance with overridden default parameters
   * Useful for creating specialized instances for different use cases
   *
   * @param partialConfig - Partial configuration to override
   * @returns New OpenRouterService instance
   */
  public withDefaults(partialConfig: Partial<OpenRouterConfig>): OpenRouterService {
    return new OpenRouterService({
      apiKey: this.apiKey,
      baseUrl: partialConfig.baseUrl ?? this.baseUrl,
      defaultModel: partialConfig.defaultModel ?? this.defaultModel,
      defaultParams: {
        ...this.defaultParams,
        ...partialConfig.defaultParams,
      },
    });
  }

  /**
   * Sends a chat completion request to OpenRouter
   *
   * @param options - Chat options including messages, model, and parameters
   * @returns Chat response with content and metadata
   * @throws OpenRouterError for various error conditions
   */
  public async chat(options: ChatOptions): Promise<ChatResponse> {
    // Validate input
    if (!options.messages || options.messages.length === 0) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "Messages array cannot be empty");
    }

    const model = options.model ?? this.defaultModel;
    const params = { ...this.defaultParams, ...options.params };

    // Validate parameters
    this.validateParameters(params);

    // Augment prompt if using JSON mode
    const messages = this.maybeAugmentPromptForJsonMode(options.messages, params.response_format);

    // Build request body
    const requestBody = this.buildRequestBody(messages, model, params);

    // Execute request with retry logic
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= OpenRouterService.MAX_RETRIES; attempt++) {
      try {
        const response = await this.executeRequest(requestBody);

        // Validate structured output if needed
        if (params.response_format) {
          this.validateStructuredOutputIfNeeded(response, params.response_format);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on non-transient errors
        if (
          error instanceof OpenRouterError &&
          ![OpenRouterErrorCode.NETWORK_ERROR, OpenRouterErrorCode.RATE_LIMIT, OpenRouterErrorCode.TIMEOUT].includes(
            error.code
          )
        ) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === OpenRouterService.MAX_RETRIES) {
          break;
        }

        // Exponential backoff with jitter
        const delay = OpenRouterService.BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        await this.sleep(delay + jitter);
      }
    }

    // All retries exhausted
    throw new OpenRouterError(OpenRouterErrorCode.API_ERROR, `Failed after ${OpenRouterService.MAX_RETRIES} attempts`, {
      lastError: lastError?.message,
    });
  }

  /**
   * Builds the request body for OpenRouter API
   *
   * @param messages - Chat messages
   * @param model - Model name
   * @param params - Generation parameters
   * @returns Request body object
   */
  private buildRequestBody(messages: Message[], model: string, params: OpenRouterParams): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Add optional parameters
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.top_p !== undefined) body.top_p = params.top_p;
    if (params.top_k !== undefined) body.top_k = params.top_k;
    if (params.frequency_penalty !== undefined) body.frequency_penalty = params.frequency_penalty;
    if (params.presence_penalty !== undefined) body.presence_penalty = params.presence_penalty;
    if (params.repetition_penalty !== undefined) body.repetition_penalty = params.repetition_penalty;
    if (params.min_p !== undefined) body.min_p = params.min_p;
    if (params.top_a !== undefined) body.top_a = params.top_a;
    if (params.seed !== undefined) body.seed = params.seed;
    if (params.max_tokens !== undefined) body.max_tokens = params.max_tokens;
    if (params.stop !== undefined) body.stop = params.stop;

    // Add response format if specified
    if (params.response_format) {
      body.response_format = params.response_format;
    }

    return body;
  }

  /**
   * Executes the HTTP request to OpenRouter API
   *
   * @param requestBody - Request body
   * @returns Parsed chat response
   * @throws OpenRouterError on various failures
   */
  private async executeRequest(requestBody: Record<string, unknown>): Promise<ChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://10xdevs-cards.app",
          "X-Title": "10xDevs Cards",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw new OpenRouterError(OpenRouterErrorCode.NETWORK_ERROR, "Network request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await this.safeParseErrorResponse(response);
      throw this.sanitizeAndMapError(response.status, errorBody);
    }

    // Parse response
    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      throw new OpenRouterError(OpenRouterErrorCode.API_ERROR, "Failed to parse API response as JSON", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Validate response structure
    if (!this.isValidChatCompletionResponse(json)) {
      throw new OpenRouterError(OpenRouterErrorCode.API_ERROR, "Invalid response structure from API", {
        response: json,
      });
    }

    const choice = json.choices[0];
    const content = choice.message.content ?? "";

    return {
      content,
      usage: json.usage
        ? {
            prompt_tokens: json.usage.prompt_tokens,
            completion_tokens: json.usage.completion_tokens,
            total_tokens: json.usage.total_tokens,
          }
        : undefined,
      model: json.model,
      raw: json,
    };
  }

  /**
   * Validates OpenRouter parameters are within acceptable ranges
   *
   * @param params - Parameters to validate
   * @throws OpenRouterError if parameters are invalid
   */
  private validateParameters(params: OpenRouterParams): void {
    if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "temperature must be between 0 and 2");
    }

    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "top_p must be between 0 and 1");
    }

    if (params.top_k !== undefined && params.top_k < 0) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "top_k must be non-negative");
    }

    if (params.max_tokens !== undefined && params.max_tokens < 1) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "max_tokens must be at least 1");
    }

    if (params.frequency_penalty !== undefined && (params.frequency_penalty < -2 || params.frequency_penalty > 2)) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "frequency_penalty must be between -2 and 2");
    }

    if (params.presence_penalty !== undefined && (params.presence_penalty < -2 || params.presence_penalty > 2)) {
      throw new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "presence_penalty must be between -2 and 2");
    }
  }

  /**
   * Validates structured output against response format requirements
   *
   * @param response - Chat response to validate
   * @param responseFormat - Expected response format
   * @throws OpenRouterError if validation fails
   */
  private validateStructuredOutputIfNeeded(response: ChatResponse, responseFormat: ResponseFormat): void {
    // For JSON mode, validate that content is valid JSON
    if (responseFormat.type === "json_object" || responseFormat.type === "json_schema") {
      try {
        JSON.parse(response.content);
      } catch (error) {
        throw new OpenRouterError(OpenRouterErrorCode.INVALID_JSON_RESPONSE, "Response content is not valid JSON", {
          content: response.content,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // For JSON schema, we could add schema validation here
    // For MVP, we trust the model to follow the schema
    // TODO: Add full JSON schema validation using a library like ajv
  }

  /**
   * Augments prompt with JSON formatting instructions if needed
   *
   * @param messages - Original messages
   * @param responseFormat - Response format requirement
   * @returns Potentially augmented messages
   */
  private maybeAugmentPromptForJsonMode(messages: Message[], responseFormat?: ResponseFormat): Message[] {
    if (!responseFormat) {
      return messages;
    }

    // Check if there's already a system message
    const hasSystemMessage = messages.some((m) => m.role === "system");

    const jsonInstruction =
      "IMPORTANT: Respond ONLY with valid JSON. Do not include markdown code blocks, explanations, or any text outside the JSON object.";

    if (hasSystemMessage) {
      // Append to existing system message
      return messages.map((m) => {
        if (m.role === "system") {
          return {
            ...m,
            content: `${m.content}\n\n${jsonInstruction}`,
          };
        }
        return m;
      });
    }

    // Add new system message at the beginning
    return [{ role: "system", content: jsonInstruction }, ...messages];
  }

  /**
   * Maps HTTP status and error response to OpenRouterError
   *
   * @param status - HTTP status code
   * @param errorBody - Error response body
   * @returns Mapped OpenRouterError
   */
  private sanitizeAndMapError(status: number, errorBody: unknown): OpenRouterError {
    const errorMessage = this.extractErrorMessage(errorBody);

    // Map status codes to error codes
    switch (status) {
      case 401:
      case 403:
        return new OpenRouterError(OpenRouterErrorCode.MISSING_API_KEY, "Authentication failed. Check your API key.", {
          status,
          message: errorMessage,
        });

      case 400:
        // Check if it's a model-related error
        if (errorMessage.toLowerCase().includes("model")) {
          return new OpenRouterError(OpenRouterErrorCode.INVALID_MODEL, "Invalid or unsupported model specified.", {
            status,
            message: errorMessage,
          });
        }
        return new OpenRouterError(OpenRouterErrorCode.INVALID_PARAMETERS, "Invalid request parameters.", {
          status,
          message: errorMessage,
        });

      case 422:
        return new OpenRouterError(
          OpenRouterErrorCode.SCHEMA_VALIDATION_FAILED,
          "Model output does not conform to schema.",
          { status, message: errorMessage }
        );

      case 429:
        return new OpenRouterError(OpenRouterErrorCode.RATE_LIMIT, "Rate limit exceeded. Please retry later.", {
          status,
          message: errorMessage,
        });

      case 503:
      case 504:
        return new OpenRouterError(OpenRouterErrorCode.TIMEOUT, "Service temporarily unavailable or timed out.", {
          status,
          message: errorMessage,
        });

      default:
        return new OpenRouterError(OpenRouterErrorCode.API_ERROR, `API error: ${errorMessage}`, {
          status,
          message: errorMessage,
        });
    }
  }

  /**
   * Safely parses error response body
   *
   * @param response - HTTP response
   * @returns Parsed error body or unknown
   */
  private async safeParseErrorResponse(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return { message: await response.text() };
    }
  }

  /**
   * Extracts error message from error response body
   *
   * @param errorBody - Error body
   * @returns Error message string
   */
  private extractErrorMessage(errorBody: unknown): string {
    if (typeof errorBody === "string") {
      return errorBody;
    }

    if (typeof errorBody === "object" && errorBody !== null) {
      const body = errorBody as Record<string, unknown>;

      // Try common error message fields
      if (typeof body.error === "string") {
        return body.error;
      }

      if (typeof body.message === "string") {
        return body.message;
      }

      if (typeof body.error === "object" && body.error !== null) {
        const error = body.error as Record<string, unknown>;
        if (typeof error.message === "string") {
          return error.message;
        }
      }
    }

    return "Unknown error occurred";
  }

  /**
   * Type guard for chat completion response
   *
   * @param json - JSON to validate
   * @returns True if valid chat completion response
   */
  private isValidChatCompletionResponse(json: unknown): json is {
    choices: { message: { content?: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    model: string;
  } {
    if (typeof json !== "object" || json === null) {
      return false;
    }

    const response = json as Record<string, unknown>;

    return (
      Array.isArray(response.choices) &&
      response.choices.length > 0 &&
      typeof response.choices[0] === "object" &&
      response.choices[0] !== null &&
      "message" in response.choices[0] &&
      typeof response.model === "string"
    );
  }

  /**
   * Sleep utility for retry backoff
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
