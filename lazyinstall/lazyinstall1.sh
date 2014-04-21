#!/bin/bash


echo 'This is the meshenger lazy install!'
echo 'It presumes your OpenWRT router has a connection to the internet'
echo 'And that you have a properly formatted usb flash drive'
echo 'more info + manual instructions: https://github.com/jngrt/meshenger'

opkg update
opkg install block-mount kmod-usb-storage kmod-usb2 kmod-fs-ext4

mkdir /mnt/sda1
mount -t ext4 /dev/sda1 /mnt/sda1

echo 'Copying filesystem to USB drive'
mkdir -p /tmp/cproot
mount --bind / /tmp/cproot
tar -C /tmp/cproot -cvf - . | tar -C /mnt/sda1 -xf
umount /tmp/cproot

mv fstab /etc/config/fstab

echo 'Reboot'
reboot -f

