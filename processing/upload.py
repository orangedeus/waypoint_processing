import requests
import argparse
import hashlib
import json
import time
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
BACKEND_API = os.getenv("WAYPOINT_BACKEND_API", "")


print("Backend api is:" + BACKEND_API);

UPLOAD_URL = '{}/upload'.format(BACKEND_API)
INSERT_URL = '{}/stops/insert'.format(BACKEND_API)
INSERT2_URL = '{}/stops/insert_screened'.format(BACKEND_API)


UPLOAD_RETRIES = 10

# 202211881536267343-2.mp4

# def upload(filename, tries = 0):

#     if (tries > upload_retries):
#         return 'fail'

#     with open(filename, 'rb') as f:

#         # getting md5 hash

#         file_hash = hashlib.md5()
#         chunk = f.read(8192)
#         while chunk:
#             file_hash.update(chunk)
#             chunk = f.read(8192)
        
#         md5 = file_hash.hexdigest()

#         files = {'file': f}
#         headers = {'x-md5': md5, 'x-filename': filename.split('/')[-1]}
#         r = requests.post(UPLOAD_URL, files=files, headers=headers)
#         if (r.json()['status'] != 1):
#             r = upload(filename, tries + 1)
#         return(r)

def getFileHash(filename):
    with open(filename, 'rb') as f:
        file_hash = hashlib.md5()
        chunk = f.read(8192)
        while chunk:
            file_hash.update(chunk)
            chunk = f.read(8192)
        f.close()
    return file_hash.hexdigest()


def upload(filename, tries = 0):

    md5 = getFileHash(filename)

    print("[-] Uploading file: {}".format(filename))

    with open(filename, 'rb') as f:

        if (tries > UPLOAD_RETRIES):
            print(" - Upload failed for {}".format(filename))
            return {'status': 0}
        file = {'upload_file': f}
        headers = {'x-md5': md5}
        r = requests.post(UPLOAD_URL, files=file, headers=headers)
        if (r.json()['status'] != 1):
            print(" - Retrying... Try #{}".format(tries + 1))
            r = upload(filename, tries + 1)
            time.sleep(2)

        return(r)
        

def insert(x, y, people, url, duration, route, batch, source_file, time = None):
    if (time == None):
        data = {
            'location': {
                'x': x,
                'y': y
            },
            'people': people,
            'url': url,
            'duration': duration,
            'route': route,
            'batch': batch,
            'source_file': source_file
        }
    else:
        data = {
            'location': {
                'x': x,
                'y': y
            },
            'people': people,
            'url': url,
            'duration': duration,
            'route': route,
            'batch': batch,
            'source_file': source_file,
            'time': time
        }
    r = requests.post(INSERT_URL, json=data)
    return r

def insert2(x, y, people):
    data = {
        'location': {
            'x': x,
            'y': y
        },
        'people': people
    }
    r = requests.post(INSERT2_URL, json=data)
    return r

def main(filename):
    i_res = insert(14.647138888888888, 121.06059444444445, 23, filename)
    u_res = upload(filename)
    print(i_res)
    print(u_res)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-V', '--video', required=True, default='uploaded.mp4')
    args = parser.parse_args()
    try:
        main(args.video)
    except Exception as e:
        print('[-] Directory may not be accessible, or: %s' % e)
