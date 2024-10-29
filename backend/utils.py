import os
import csv

topics_file = "topics.csv"

def initialize_topics_file():
    if not os.path.exists(topics_file):
        with open(topics_file, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["topic", "count"])

def update_topic_count(new_topics):
    topics_dict = {}
    if os.path.exists(topics_file):
        with open(topics_file, mode='r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                topics_dict[row["topic"]] = int(row["count"])
    
    for topic in new_topics:
        topics_dict[topic] = topics_dict.get(topic, 0) + 1
    
    with open(topics_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["topic", "count"])
        for topic, count in topics_dict.items():
            writer.writerow([topic, count])

def get_most_frequent_topics(n=4):
    topics = []
    if os.path.exists(topics_file):
        with open(topics_file, mode='r') as file:
            reader = csv.DictReader(file)
            sorted_topics = sorted(reader, key=lambda x: int(x["count"]), reverse=True)
            topics = [row["topic"] for row in sorted_topics[:n]]
    return topics