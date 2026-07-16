"""Admin Config Router - storage directory, tunnel token/domain settings."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models import User
from auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


class UpdateConfigParameters(BaseModel):
    data_dir: str
    tunnel_token: Optional[str] = ""
    total_storage_limit_mb: Optional[int] = 0
    auto_start_tunnel: Optional[bool] = False
    tunnel_custom_domain: Optional[str] = ""


@router.get("/config")
async def get_config(admin: User = Depends(get_admin_user)):
    """Get server data directory configuration."""
    import config
    return {
        "data_dir": str(config.DATA_DIR),
        "db_dir": str(config.DB_DIR),
        "tunnel_token": getattr(config, "TUNNEL_TOKEN", ""),
        "total_storage_limit_mb": getattr(config, "TOTAL_STORAGE_LIMIT_MB", 0),
        "auto_start_tunnel": getattr(config, "AUTO_START_TUNNEL", False),
        "tunnel_custom_domain": getattr(config, "TUNNEL_CUSTOM_DOMAIN", ""),
    }


@router.post("/config")
async def update_config(req: UpdateConfigParameters, admin: User = Depends(get_admin_user)):
    """Update server data directory configuration."""
    import config

    path_str = req.data_dir.strip()
    if not path_str:
        raise HTTPException(status_code=400, detail="Depolama yolu boş olamaz")

    try:
        config.update_config(
            path_str,
            req.tunnel_token or "",
            req.total_storage_limit_mb or 0,
            bool(req.auto_start_tunnel),
            req.tunnel_custom_domain or "",
        )
        return {
            "message": "Ayarlar başarıyla güncellendi",
            "data_dir": str(config.DATA_DIR),
            "tunnel_token": getattr(config, "TUNNEL_TOKEN", ""),
            "total_storage_limit_mb": getattr(config, "TOTAL_STORAGE_LIMIT_MB", 0),
            "auto_start_tunnel": getattr(config, "AUTO_START_TUNNEL", False),
            "tunnel_custom_domain": getattr(config, "TUNNEL_CUSTOM_DOMAIN", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ayarlar güncellenirken hata oluştu: {str(e)}")
