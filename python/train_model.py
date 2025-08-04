import tensorflow as tf

# Constants
TFRECORD_FILE = 'data/train.tfrecord'
BATCH_SIZE = 32
NUM_FEATURES = 13 * 4  # 33 keypoints * (x,y,z,visibility)
NUM_CLASSES = 4

def parse_example(example_proto):
    feature_description = {
        'keypoints': tf.io.FixedLenFeature([NUM_FEATURES], tf.float32),
        'label': tf.io.FixedLenFeature([], tf.int64),
    }
    example = tf.io.parse_single_example(example_proto, feature_description)
    return example['keypoints'], example['label']

def load_dataset(tfrecord_path):
    dataset = tf.data.TFRecordDataset(tfrecord_path)
    dataset = dataset.map(parse_example)
    dataset = dataset.shuffle(1000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    return dataset

def build_model():
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=(NUM_FEATURES,)),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(NUM_CLASSES, activation='softmax')
    ])
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    dataset = load_dataset(TFRECORD_FILE)

    model = build_model()
    model.summary()

    model.fit(dataset, epochs=20)

    model.save("models/saved_model/swim_phase_classifier.keras")

    print("Model training complete and saved!")

if __name__ == "__main__":
    main()
