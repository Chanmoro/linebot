# -*- coding: utf-8 -*-
import websocket
import json
import ssl
import time
import random
import os
import sys


# websocket event
def on_message(ws, data):
    print('### on message ###')
    json_data = json.loads(data)

    for received_data in json_data['result']:
        print(received_data)
        dialog(received_data)


def on_error(ws, error):
    print('### on error ###')
    print(error)


def on_close(ws):
    print('### connection closed ###')


def on_open(ws):
    print('### connection open ###')


# dialog and action
scenario = []
scenario.append({'msg': ['hello'], 'res': ['hi'], 'action': 'debug'})
scenario.append({'msg': ['hi'], 'res': ['hi\nwhat\'s up?']})
scenario.append({'msg': ['how', 'are', 'you'],
                 'res': ['not bad\nhow about you?']})

random_response = ['oh', 'good', 'uh-huh', 'right', 'I see']


def debug(received_data):
    print('### debug ###')
    print(received_data)


def dialog(received_data):
    print('### dialog ###')
    bot_message = None
    hit_pattern = None

    for pattern in scenario:
        hit = False
        for i, word in enumerate(pattern['msg']):
            received_message = received_data['content']['text'].lower()
            if received_message.find(word) == -1:
                break
            elif i == len(pattern['msg']) - 1:
                hit = True
                hit_pattern = pattern
        if hit:
            break

    if hit_pattern is None:
        bot_message = random_response[
            random.randint(0, len(random_response) - 1)]
        send_message(received_data, bot_message)
    else:
        if 'res' in hit_pattern:
            for res in hit_pattern['res']:
                bot_message = res
                send_message(received_data, bot_message)

    if hit_pattern is not None:
        if 'action' in hit_pattern:
            func_name = hit_pattern['action']
            eval(func_name)(received_data)


# send bot message to user
def send_message(received_data, message):
    print('### send_message ###')
    print(message)

    send_data = {}
    send_data['to'] = [received_data['content']['from']]
    send_data['toChannel'] = 1383378250           # fixed value
    send_data['eventType'] = '140177271400161403'  # fixed value
    send_data['content'] = {'messageNotified': 0,
                            'messages': [{'contentType': 1, 'text': message}]}
    ws.send(json.dumps(send_data, ensure_ascii=False))
    time.sleep(0.3)


if __name__ == '__main__':
    websocket.enableTrace(True)
    # ws =
    URL = 'wss://<url to linebot-proxy>'
    ws = websocket.WebSocketApp(URL,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.on_open = on_open
    ws.run_forever(ping_interval=5)
    # ws.run_forever(sslopt={'cert_reqs': ssl.CERT_NONE})
