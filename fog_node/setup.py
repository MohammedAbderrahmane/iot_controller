from setuptools import setup, find_packages

setup(
    name="fognode",
    version="0.1",
    py_modules=["server"],
    install_requires=["aiocoap", "mysql-connector-python", "python-dotenv" , "cbor2", "lakers" , "cryptography" , "filelock", "requests"    ],
    entry_points={
        'console_scripts': [
            'start-fog-node = server:main',
        ],
    },
)
