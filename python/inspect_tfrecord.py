import tensorflow as tf

record_iterator = tf.data.TFRecordDataset('data/train.tfrecord')

for raw_record in record_iterator.take(1):
    example = tf.train.Example()
    example.ParseFromString(raw_record.numpy())
    print(example)
