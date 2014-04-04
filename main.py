import socket, os, time, select, urllib, sys

def announce():

	#announces it's existance to other nodes
	sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
	sock.sendto(bericht, ("ff02::1", 13337))
	sock.close()

def index():

	a = ''
	# builds the latest index of all the messages that are on this node

def discover(known_devices):

	# discovers other nodes by listening to the Meshenger announce port
	own_ip = get_ip_adress()
	port = 13337  # where do you expect to get a msg?
	bufferSize = 1024 # whatever you need

	s = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
	s.bind(('::', port))
	s.setblocking(0)

	global devices

	while True:
	    result = select.select([s],[],[])[0][0].recvfrom(bufferSize)
	    if result not in known_devices and result[1][0] != own_ip:
	   		devices.append(result[1][0])
	   		return
	    time.sleep(1)

def serve():

	a = ''
	# serves both the index and the messages on the node over http
	# plus manages the client-side web interface

def build_index():
	previous_index = []

	current_index = os.listdir('msg/')

	if current_index != previous_index:
		with open('index', 'wb') as index:
			for message in os.listdir('msg/'):
				index.write(message)
				index.write('\n')
		current_index = previous_index

def get_index(ip, path):

	os.system('wget http://['+ip+'%adhoc0]:13338/index -O '+os.path.join(path,'index'))

	# downloads the index from other nodes and then proceeds to downloads messages it doesn't have already

def get_messages(ip, path):

	with open(os.path.join(path,'index')) as index:
		index = index.read().split('\n')
		for message in index:
			messagepath = os.path.join(os.path.abspath('msg/'), message)
			if not os.path.exists(messagepath):
				print 'downloading', message, 'to', messagepath
				os.system('wget http://['+ip+'%adhoc0]:13338/msg/'+message+' -O '+messagepath)


	# s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)

	# s.connect(('http://[fe80::6666:b3ff:feeb:68c2%adhoc0]/lijst', 13338))

	# s.send("GET / HTTP/1.0\r\n\r\n")

	# while 1:
	# 	buf = s.recv(1000)
	# 	if not buf:
	# 		break
	# 	sys.stdout.write(buf)

	# s.close()

def ip_to_hash(ip):
	import hashlib
	hasj = hashlib.md5(ip).hexdigest()
	nodepath = os.path.join(os.path.abspath('nodes/'), hasj)
	if not os.path.exists(nodepath):
		os.mkdir(nodepath)

	return nodepath


def clientsite():
	a = ''

#tools

def get_ip_adress():
	if not os.path.isfile('interfaceip6adress'):
		os.system('ifconfig -a adhoc0 | grep inet6 > interfaceip6adress')

	with open('interfaceip6adress', 'r') as a:
		return a.read().split()[2].split('/')[0]

while True:
	devices = [] #the list of all the nodes this this node has seen
	print 'discovering devices'
	time.sleep(1)
	discover(devices)

	if len(devices) > 0:
		print 'found', len(devices),'device(s) retreiving indices'
		for device in devices:
			nodepath = ip_to_hash(device)

			get_index(device, nodepath)

			get_messages(device, nodepath)
			print 'updating own index'
			build_index()
			#voeg toe aan eigen index --> build_index()
	time.sleep(5)
