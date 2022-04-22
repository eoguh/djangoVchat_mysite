from channels.generic.websocket import AsyncWebsocketConsumer
import json


class ChatConsumer(AsyncWebsocketConsumer):
	# this fuction connects the user that visits the socket url to the channel
	async def connect(self):
		print('\n\nconnect function activated\n')
		self.room_group_name = 'Test-Room'
		await self.channel_layer.group_add( # adds the user to the channel layer belonging to the 
				self.room_group_name, # self.room_group_name is defined above, inside this function.
				self.channel_name, # a channel name is automatically assigned to each connecter user
			)
		await self.accept() # accepts the connection
		
	# this fuction is triggered to disconnect a user from the channel if need be.
	async def disconnect(self, close_code):
		print('\n\ndisconnect function activated\n')

		await self.channel_layer.group_discard(
				self.room_group_name,
				self.channel_name
			)
		print('Disconnected...')

	# This function is triggered when the channel layer receives a message or an object.
	async def receive(self, text_data):
		print('\n\nreceive function activated\n')
		receive_dict = json.loads(text_data)
		message = receive_dict['message']
		action = receive_dict['action']

		# breaks the process if when we receive objects sent by self.
		# if message['receiver_channel_name'] == self.channel_name:
		# 	return

		if (action == 'new-offer') or (action == 'new-answer'):

			print('\n\nNew offer or New answer recieved.\n')
			receiver_channel_name = receive_dict['message']['receiver_channel_name']

			receive_dict['message']['receiver_channel_name'] = self.channel_name


			await self.channel_layer.send(
				receiver_channel_name,
				{
					'type':'send.sdp',
					'receive_dict': receive_dict
				}
			)
			return

		# reassigns the receiver_channel_name value in the dict. to the channel name of this receiver.
		receive_dict['message']['receiver_channel_name'] = self.channel_name

		await self.channel_layer.group_send(
				self.room_group_name,
				{
					'type':'send.sdp',
					'receive_dict': receive_dict
				}
			)

	# This function sends out the received object.
	async def send_sdp(self, event):
		print('\n\nsend_message function activated\n')
		receive_dict = event['receive_dict']

		await self.send(text_data=json.dumps(receive_dict))




