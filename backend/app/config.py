"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central settings validated by Pydantic on startup."""

    hf_api_token: str
    hf_model_id: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    cors_origins: str = "http://localhost:3000"
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
