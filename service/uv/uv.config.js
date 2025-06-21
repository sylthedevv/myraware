self.__uv$config = {
    prefix: '/service/',
    bare:'https://6qjvmz.152.53.38.100.nip.io/bare/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/service/uv/uv.handler.js',
    bundle: '/service/uv/uv.bundle.js',
    config: '/service/uv/uv.config.js',
    sw: '/service/uv/uv.sw.js',
};
