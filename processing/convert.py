import argparse
import os
import subprocess


class Converter:

    def __init__(self, input):
        self.input = input

    def start(self):

    
    def get_duration(self, vid):
        dur_comm = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {}".format(vid)
        try:
            res = subprocess.check_output(dur_comm, stderr=subprocess.STDOUT, shell=True)
        except subprocess.CalledProcessError as e:
            res = e.output
        return round(float(res))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument('-I', '--input', required=False, default="input.ifv")

    args = parser.parse_args()

    Converter(input=args.input).start()

