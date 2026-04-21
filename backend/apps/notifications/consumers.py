"""
WebSocket consumers.

Passengers connect to /ws/user/ → they're joined to `user.{id}`.
Restaurant staff connect to /ws/restaurant/{id}/ → `restaurant.{id}` after
verifying an active membership.
"""
from __future__ import annotations

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.accounts.models import Membership


class UserConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.group = f'user.{user.id}'
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group'):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def notify(self, event):
        await self.send_json(event.get('payload', {}))


class RestaurantConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        restaurant_id = int(self.scope['url_route']['kwargs']['restaurant_id'])
        allowed = await self._is_member(user.id, restaurant_id)
        if not allowed:
            await self.close(code=4403)
            return
        self.group = f'restaurant.{restaurant_id}'
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group'):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def notify(self, event):
        await self.send_json(event.get('payload', {}))

    @database_sync_to_async
    def _is_member(self, user_id, restaurant_id) -> bool:
        return Membership.objects.filter(
            user_id=user_id,
            restaurant_id=restaurant_id,
            is_active=True,
        ).exists()
