# Connection to object storage (e.g., MinIO, AWS S3) for storing and retrieving data.
from typing import Any, Dict, List
import logging
import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.core.config import get_settings

logger = logging.getLogger(__name__)

class ObjectStorageClient:
    """Client for interacting with object storage services like MinIO or AWS S3."""
    
    def __init__(self):
        settings = get_settings()
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.bucket_name = settings.S3_BUCKET_NAME
        
        logger.info(f"Initializing S3 client with endpoint: {self.endpoint_url}")
        
        try:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
                # Additional parameters for MinIO compatibility
                use_ssl=self.endpoint_url.startswith('https'),
            )
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {str(e)}")
            raise

    def upload_file(self, file_path: str, object_name: str) -> None:
        """Upload a file to the object storage."""
        try:
            logger.debug(f"Uploading file {file_path} to {self.bucket_name}/{object_name}")
            self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            logger.info(f"Successfully uploaded {object_name} to {self.bucket_name}")
        except ClientError as e:
            logger.error(f"S3 ClientError uploading {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to upload {file_path} to {object_name}: {str(e)}")
        except BotoCoreError as e:
            logger.error(f"S3 BotoCoreError uploading {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to upload {file_path} to {object_name}: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error uploading {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to upload {file_path} to {object_name}: {str(e)}")

    def download_file(self, object_name: str, file_path: str) -> None:
        """Download a file from the object storage."""
        try:
            logger.debug(f"Downloading {self.bucket_name}/{object_name} to {file_path}")
            self.s3_client.download_file(self.bucket_name, object_name, file_path)
            logger.info(f"Successfully downloaded {object_name} from {self.bucket_name}")
        except ClientError as e:
            logger.error(f"S3 ClientError downloading {object_name}: {str(e)}")
            raise RuntimeError(f"Failed to download {object_name}: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error downloading {object_name}: {str(e)}")
            raise RuntimeError(f"Failed to download {object_name}: {str(e)}")

    def delete_file(self, object_name: str) -> None:
        """Delete a file from the object storage."""
        try:
            logger.debug(f"Deleting {self.bucket_name}/{object_name}")
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            logger.info(f"Successfully deleted {object_name} from {self.bucket_name}")
        except ClientError as e:
            logger.error(f"S3 ClientError deleting {object_name}: {str(e)}")
            raise RuntimeError(f"Failed to delete {object_name}: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error deleting {object_name}: {str(e)}")
            raise RuntimeError(f"Failed to delete {object_name}: {str(e)}")
        
    def delete_files(self, object_names: List[str]) -> None:
        """Delete multiple files from the object storage."""
        try:
            objects = [{'Key': name} for name in object_names]
            logger.debug(f"Deleting {len(objects)} files from {self.bucket_name}")
            self.s3_client.delete_objects(Bucket=self.bucket_name, Delete={'Objects': objects})
            logger.info(f"Successfully deleted {len(objects)} files from {self.bucket_name}")
        except ClientError as e:
            logger.error(f"S3 ClientError deleting multiple files: {str(e)}")
            raise RuntimeError(f"Failed to delete multiple files: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error deleting multiple files: {str(e)}")
            raise RuntimeError(f"Failed to delete multiple files: {str(e)}")

    def list_files(self, prefix: str = "") -> List[Dict[str, Any]]:
        """List files in the bucket with an optional prefix."""
        try:
            logger.debug(f"Listing files in {self.bucket_name} with prefix '{prefix}'")
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            files = response.get('Contents', [])
            logger.debug(f"Found {len(files)} files with prefix '{prefix}'")
            return files
        except ClientError as e:
            logger.error(f"S3 ClientError listing files: {str(e)}")
            raise RuntimeError(f"Failed to list files: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error listing files: {str(e)}")
            raise RuntimeError(f"Failed to list files: {str(e)}")

    def download_url(self, object_name: str, expires: int = 300) -> str:
        """Generate a presigned GET URL for an object that expires in `expires` seconds."""
        try:
            logger.debug(f"Generating presigned URL for {self.bucket_name}/{object_name} (expires={expires})")
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expires,
            )
            return url
        except ClientError as e:
            logger.error(f"S3 ClientError generating presigned URL for {object_name}: {str(e)}")
            raise RuntimeError(f"Failed to generate presigned URL: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL for {object_name}: {str(e)}")
            raise RuntimeError(f"Failed to generate presigned URL: {str(e)}")