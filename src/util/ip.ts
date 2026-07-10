import os from 'os';

let ip = '0.0.0.0';
const ips = os.networkInterfaces();
if (!ips) throw new Error("Invalid OS package usage.");
Object
  .keys(ips)
  .forEach(function(_interface) {
    if (!ips[_interface]) throw new Error('ips[_interface] undefined');
    ips[_interface]
      .forEach(function(_dev) {
        if (_dev.family === 'IPv4' && !_dev.internal) ip = _dev.address
      })
  });

export function getLocalIp(): string { return ip };
