"""
Unified DRF exception handler → consistent error envelope:

    {"error": {"code": "...", "message": "...", "details": {...}}}
"""
from __future__ import annotations

import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


class DomainError(Exception):
    """Raise from service layer for business-rule violations."""

    status_code = 400
    code = 'domain_error'

    def __init__(self, message: str, *, code: str | None = None, details: dict | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        self.details = details or {}


class OTPError(DomainError):
    code = 'otp_error'


def api_exception_handler(exc, context):
    if isinstance(exc, DomainError):
        return Response(
            {'error': {'code': exc.code, 'message': exc.message, 'details': exc.details}},
            status=exc.status_code,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception('Unhandled exception', exc_info=exc)
        return Response(
            {'error': {'code': 'server_error', 'message': 'Internal server error'}},
            status=500,
        )

    code = exc.__class__.__name__
    data = response.data
    if isinstance(data, dict) and 'detail' in data:
        message = str(data['detail'])
        details = {}
    else:
        message = 'Request failed'
        details = data if isinstance(data, dict) else {'errors': data}

    response.data = {'error': {'code': code, 'message': message, 'details': details}}
    return response
