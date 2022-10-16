#!/usr/bin/env python3

import tensorflow as tf
import evaluate
import cv2
import time
import argparse
import timeit
import datetime
import os
from common import draw_str
import gc
"""
- dataset 1 process (splices) - # of splices
- input # of splices - python video_counting.py --video dataset.mp4 --frames # - # of people per splice
- gps coordinate, # of people - send to databas
- upload / send sa database"""

def main():
    parser = argparse.ArgumentParser(description='People counting utilizing Tiny Faces')
    parser.add_argument('--video', default=0)
    parser.add_argument('--weight', default='model.pkl')
    parser.add_argument('--detect_interval', default=8)
    parser.add_argument('--sleep_interval', default=0)
    parser.add_argument('--play', default=False)
    parser.add_argument('--frames', default=1)
    args = parser.parse_args()
    FaceDetect(video=args.video, weight=args.weight, detect_interval=args.detect_interval, sleep_interval=args.sleep_interval, play=args.play).run()
    # python video_counting.py --video dataset.mp4 --frames 4 
class FaceDetect:
    def __init__(self, video, weight, detect_interval, sleep_interval, play):
        self.weight = weight
        self.video_file = video
        self.detect_interval = detect_interval
        self.sleep_interval = sleep_interval
        self.cap = cv2.VideoCapture(video)
        self.play_bool = play
        self.frames = []
        self.count = 0
        self.max = 0
        self.time = 0
        self.script_dir = os.path.dirname(os.path.realpath(__file__))
    def run(self):
        self.generate_receipt()
        start = timeit.default_timer()
        i = 0
        fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.detect_interval = frames // 4

        for i in range(5):
            self.cap.set(1, (self.detect_interval * i))
            ret, frame = self.cap.read()
            bboxes = []

            if not ret:
                break

            detect_start = timeit.default_timer()
            bboxes = evaluate.evaluate(weight_file_path=self.weight, img=frame)
            self.count = len(bboxes)
            self.max = max(self.max, self.count)
            detect_end = timeit.default_timer()
            print("\t Frame #: {}, # of people: {}, time elapsed: {}".format(self.detect_interval * i, self.count, detect_end - detect_start))
            self.frames.append(frame)
            gc.collect()

        print("[*] Filename: {}, FPS: {}".format(self.video_file, fps))
        # while True:
        #     ret, frame = self.cap.read()
        #     bboxes = []

        #     if not ret:
        #         break
            
            

        #     if i % self.detect_interval == 0:
        #         detect_start = timeit.default_timer()
        #         bboxes = evaluate.evaluate(weight_file_path=self.weight, img=frame)
        #         self.count = len(bboxes)
        #         self.max = max(self.max, self.count)

        #         for point in bboxes:
        #             cv2.rectangle(frame, (point[0], point[1]), (point[2], point[3]), (255, 0, 0))
        #         #cv2.imshow('Video', frame)
        #         detect_end = timeit.default_timer()
        #         print("\t Frame #: {}, # of people: {}, time elapsed: {}".format(i, self.count, detect_end - detect_start))
        #         self.frames.append(frame)
        #     gc.collect()
        #     i += 1

        end = timeit.default_timer()
        self.time = end - start
        if (self.play_bool):
            self.play(self.frames)

        self.cap.release()
        print("Time elapsed: {}, Max number of detected people: {}".format(self.time, self.max))
        gc.collect()

    def generate_receipt(self):
        dir = self.script_dir + "/receipt.txt"
        with open(dir, "a") as f:
            f.write(" Ran Tinyfaces - > fd.py < through Anaconda Environment.\n")
            f.close()

    def visualize(self, frame):
        draw_str(frame, (20, 40), 'People: {}'.format(self.count))

    def play(self, frames):
        print("[*] Playing...")
        for i in frames:
            time.sleep(0.05)
            # cv2.imshow("Video", i)
            c = cv2.waitKey(1)
            if c == 27: # esc press
                break
        
if __name__ == "__main__":
    main()
