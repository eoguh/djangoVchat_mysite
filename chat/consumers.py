from channels.generic.websocket import AsyncWebsocketConsumer
import json


class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		print('\n\nconnect function activated\n')
		self.room_group_name = 'Test-Room'
		await self.channel_layer.group_add(
				self.room_group_name,
				self.channel_name,
			)
		await self.accept()
		

	async def disconnect(self, close_code):
		print('\n\ndisconnect function activated\n')

		await self.channel_layer.group_discard(
				self.room_group_name,
				self.channel_name
			)
		print('Disconnected...')

	async def receive(self, text_data):
		print('\n\nrecieve function activated\n')
		recieve_dict = json.loads(text_data)
		message = recieve_dict['message']

		await self.channel_layer.group_send(
				self.room_group_name,
				{
					# 'type':'send.message',
					'type':'chat_message',
					'message': message
				}
			)

	async def chat_message(self, event):
		print('\n\nsend_message function activated\n')
		message = event['message']

		await self.send(text_data=json.dumps({
				'message': message
			}))

		

