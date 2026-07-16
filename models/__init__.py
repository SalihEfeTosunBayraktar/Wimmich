"""Wimmich Database Models - public API surface.

Split into per-domain modules (user/asset/album/face/sharing/job); all
model classes and helpers are re-exported here so existing
`from models import User, Asset, ...` call sites are unaffected.
"""
from database import Base
from models.common import generate_uuid, utcnow
from models.user import User
from models.asset import Asset
from models.album import Album, AlbumAsset, AlbumUser
from models.face import Person, Face
from models.sharing import SharedLink
from models.job import Job
from models.duplicate_ignore import IgnoredDuplicateGroup
from models.category_correction import CategoryCorrection
from models.similar_asset import SimilarAsset
from models.similar_ignore import IgnoredSimilarAsset

__all__ = [
    "Base",
    "generate_uuid",
    "utcnow",
    "User",
    "Asset",
    "Album",
    "AlbumAsset",
    "AlbumUser",
    "Person",
    "Face",
    "SharedLink",
    "Job",
    "IgnoredDuplicateGroup",
    "CategoryCorrection",
    "SimilarAsset",
    "IgnoredSimilarAsset",
]
