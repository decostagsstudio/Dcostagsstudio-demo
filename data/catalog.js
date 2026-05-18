const products = {
  men: [
    {
      name: "Camisa Oxford Arena",
      price: 39.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Chaqueta Negra Essential",
      price: 79.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Pantalón Recto Stone",
      price: 49.9,
      sizes: ["34", "35", "36", "37", "38"],
      image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Jersey Punto Crudo",
      price: 44.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Camiseta Premium Blanca",
      price: 24.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Abrigo Largo Camel",
      price: 119.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Sudadera Gris Studio",
      price: 54.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Polo Negro Minimal",
      price: 32.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Vaquero Slim Azul",
      price: 59.9,
      sizes: ["34", "35", "36", "37", "38"],
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Sobrecamisa Verde Oliva",
      price: 69.9,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop",
    },
  ],
  women: [
    {
      name: "Vestido Midi Blanco",
      price: 59.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Blazer Crema Studio",
      price: 89.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Top Satinado Negro",
      price: 34.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Camisa Oversize Azul",
      price: 42.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Pantalón Palazzo Beige",
      price: 54.9,
      sizes: ["34", "35", "36", "37", "38"],
      image: "https://images.unsplash.com/photo-1771621089871-55ed3cfa9dc4?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Falda Satinada Champagne",
      price: 46.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Abrigo Lana Gris",
      price: 129.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Camiseta Rib Marfil",
      price: 27.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Mono Negro Essential",
      price: 74.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Cárdigan Punto Arena",
      price: 52.9,
      sizes: ["XS", "S", "M", "L", "XL"],
      image: "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?q=80&w=900&auto=format&fit=crop",
    },
  ],
  wallets: [
    {
      name: "Cartera Piel Negra",
      price: 29.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Cartera Bifold Marrón",
      price: 34.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Tarjetero Minimal Negro",
      price: 19.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1639789972237-7ee9434066ed?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Cartera Slim Chocolate",
      price: 27.9,
      sizes: ["One size"],
      image: "https://images.pexels.com/photos/15763948/pexels-photo-15763948.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      name: "Cartera Monedero Classic",
      price: 32.9,
      sizes: ["One size"],
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Leather_coin_purse.jpg/960px-Leather_coin_purse.jpg",
    },
  ],
  bags: [
    {
      name: "Bolso Tote Negro",
      price: 69.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Bandolera Camel",
      price: 54.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Shopper Beige",
      price: 64.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Mini Negro",
      price: 49.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Hobo Crema",
      price: 59.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1585488763177-bde7d15fd3cf?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Satchel Marrón",
      price: 74.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso de Mano Marfil",
      price: 44.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Crossbody Taupe",
      price: 52.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1559563458-527698bf5295?q=80&w=900&auto=format&fit=crop",
    },
    {
      name: "Bolso Clutch Negro",
      price: 39.9,
      sizes: ["One size"],
      image: "https://images.pexels.com/photos/32498616/pexels-photo-32498616.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      name: "Bolso Piel Granate",
      price: 84.9,
      sizes: ["One size"],
      image: "https://images.unsplash.com/photo-1601924921557-45e6dea0a157?q=80&w=900&auto=format&fit=crop",
    },
  ],
};

const warmImageSet = {
  men: [
    "https://images.pexels.com/photos/3754251/pexels-photo-3754251.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/31888152/pexels-photo-31888152.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7096981/pexels-photo-7096981.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7252074/pexels-photo-7252074.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7653836/pexels-photo-7653836.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7251066/pexels-photo-7251066.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/4398944/pexels-photo-4398944.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3054983/pexels-photo-3054983.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/5917210/pexels-photo-5917210.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7904116/pexels-photo-7904116.jpeg?auto=compress&cs=tinysrgb&w=900",
  ],
  women: [
    "https://images.pexels.com/photos/3916426/pexels-photo-3916426.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7760239/pexels-photo-7760239.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/9019647/pexels-photo-9019647.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3271038/pexels-photo-3271038.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/9637859/pexels-photo-9637859.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/13585507/pexels-photo-13585507.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/6073541/pexels-photo-6073541.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/11446780/pexels-photo-11446780.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/6774283/pexels-photo-6774283.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3189020/pexels-photo-3189020.jpeg?auto=compress&cs=tinysrgb&w=900",
  ],
  wallets: [
    "https://images.pexels.com/photos/8062364/pexels-photo-8062364.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/37326648/pexels-photo-37326648.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/8062364/pexels-photo-8062364.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/15763948/pexels-photo-15763948.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/37326648/pexels-photo-37326648.jpeg?auto=compress&cs=tinysrgb&w=900",
  ],
  bags: [
    "https://images.pexels.com/photos/8396731/pexels-photo-8396731.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/29096395/pexels-photo-29096395.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/9595067/pexels-photo-9595067.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/31449623/pexels-photo-31449623.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/14039947/pexels-photo-14039947.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/31451027/pexels-photo-31451027.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/31529647/pexels-photo-31529647.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/7742501/pexels-photo-7742501.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/33708892/pexels-photo-33708892.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/31090142/pexels-photo-31090142.jpeg?auto=compress&cs=tinysrgb&w=900",
  ],
};

Object.entries(warmImageSet).forEach(([category, images]) => {
  products[category].forEach((product, index) => {
    product.image = images[index];
  });
});

const productProfiles = {
  men: [
    ["beige", "Algodón Oxford", "Corte regular", "Nuevo"],
    ["negro", "Sarga compacta", "Corte recto", "Últimas unidades"],
    ["beige", "Algodón elástico", "Corte recto", "Disponible en tienda"],
    ["blanco", "Punto suave", "Corte relajado", "Nuevo"],
    ["blanco", "Algodón premium", "Corte regular", "Básico"],
    ["marrón", "Paño cálido", "Corte largo", "Edición limitada"],
    ["gris", "Felpa compacta", "Corte relajado", "Disponible en tienda"],
    ["negro", "Piqué de algodón", "Corte regular", "Básico"],
    ["azul", "Denim", "Corte slim", "Disponible en tienda"],
    ["verde", "Sarga ligera", "Corte overshirt", "Nuevo"],
  ],
  women: [
    ["blanco", "Viscosa fluida", "Corte midi", "Nuevo"],
    ["beige", "Sastrería ligera", "Corte estructurado", "Favorito"],
    ["negro", "Satén suave", "Corte fluido", "Disponible en tienda"],
    ["azul", "Algodón popelín", "Corte oversize", "Nuevo"],
    ["beige", "Tejido fluido", "Corte palazzo", "Favorito"],
    ["beige", "Satén", "Corte evasé", "Disponible en tienda"],
    ["gris", "Lana mezclada", "Corte recto", "Últimas unidades"],
    ["blanco", "Canalé elástico", "Corte ajustado", "Básico"],
    ["negro", "Crepé ligero", "Corte amplio", "Nuevo"],
    ["beige", "Punto medio", "Corte regular", "Disponible en tienda"],
  ],
  wallets: [
    ["negro", "Piel", "Formato compacto", "Básico"],
    ["marrón", "Piel", "Bifold", "Disponible en tienda"],
    ["negro", "Piel", "Tarjetero", "Nuevo"],
    ["marrón", "Piel", "Slim", "Últimas unidades"],
    ["marrón", "Piel", "Monedero", "Disponible en tienda"],
  ],
  bags: [
    ["negro", "Piel efecto liso", "Tote", "Favorito"],
    ["marrón", "Piel efecto liso", "Bandolera", "Nuevo"],
    ["beige", "Textura granulada", "Shopper", "Disponible en tienda"],
    ["negro", "Piel efecto liso", "Mini", "Últimas unidades"],
    ["beige", "Textura suave", "Hobo", "Nuevo"],
    ["marrón", "Piel efecto liso", "Satchel", "Disponible en tienda"],
    ["blanco", "Acabado marfil", "De mano", "Básico"],
    ["beige", "Textura granulada", "Crossbody", "Favorito"],
    ["negro", "Satén", "Clutch", "Edición limitada"],
    ["marrón", "Piel efecto liso", "Granate", "Nuevo"],
  ],
};

Object.entries(products).forEach(([category, items]) => {
  items.forEach((product, index) => {
    const [color, material, fit, badge] = productProfiles[category][index] || ["neutro", "Tejido seleccionado", "Corte regular", "Disponible"];
    product.id = `${category}-${index + 1}`;
    product.color = color;
    product.material = material;
    product.fit = fit;
    product.badge = badge;
    product.stock = badge === "Últimas unidades" ? "Pocas unidades" : "Disponible en tienda";
    product.care = category === "bags" || category === "wallets" ? "Limpiar con paño suave y guardar protegido de humedad." : "Lavar en frío, no usar lejía y secar en plano cuando sea necesario.";
    product.description = `Pieza de ${category === "bags" || category === "wallets" ? "accesorio" : "colección"} con ${material.toLowerCase()}, acabado ${color} y ${fit.toLowerCase()}. Pensada para integrarse en un armario actual con presencia limpia.`;
    product.images = [
      product.image,
      warmImageSet[category][(index + 1) % warmImageSet[category].length],
      warmImageSet[category][(index + 2) % warmImageSet[category].length],
    ];
  });
});

window.DCOSTA_PRODUCTS_BY_CATEGORY = products;

