const parseLabelIntoName = (label) => {
    switch (label) {
        case 'belawan':
            return 'Belawan'; break;
        case 'bitung2':
            return 'Bitung Cam 2'; break;
        case 'bjn1':
            return 'Bojonegara Cam 1'; break;
        case 'bjn10':
            return 'Bojonegara Cam 10'; break;
        case 'bjn2':
            return 'Bojonegara Cam 2'; break;
        case 'bjn3':
            return 'Bojonegara Cam 3'; break;
        case 'bjn4':
            return 'Bojonegara Cam 4'; break;
        case 'bjn5':
            return 'Bojonegara Cam 5'; break;
        case 'bjn6':
            return 'Bojonegara Cam 6'; break;
        case 'bjn7':
            return 'Bojonegara Cam 7'; break;
        case 'bjn8':
            return 'Bojonegara Cam 8'; break;
        case 'bjn9':
            return 'Bojonegara Cam 9'; break;
        case 'bongas':
            return 'Bongas'; break;
        case 'cikande':
            return 'Cikande'; break;
        case 'cmgs2_1':
            return 'Cimanggis Cam 2'; break;
        case 'demangld1':
            return 'Demang Lebar Daun Cam 1'; break;
        case 'demangld2':
            return 'Demang Lebar Daun Cam 2'; break;
        case 'demangld3':
            return 'Demang Lebar Daun Cam 3'; break;
        case 'demangld4':
            return 'Demang Lebar Daun Cam 4'; break;
        case 'demangld5':
            return 'Ddemang Lebar Daun Cam 5'; break;
        case 'demangld6':
            return 'Demang Lebar Daun Cam 6'; break;
        case 'dlt_mas':
            return 'Delta Mas Cam 1'; break;
        case 'dlt_mas2':
            return 'Delta Mas Cam 2'; break;
        case 'dumai':
            return 'Dumai Cam 1'; break;
        case 'dumai2':
            return 'Dumai Cam 2'; break;
        case 'dumai3':
            return 'Dumai Cam 3'; break;
        case 'gressik1':
            return 'Gressik Cam 1'; break;
        case 'gressik2':
            return 'Gressik Cam 2'; break;
        case 'gressik3':
            return 'Gressik Cam 3'; break;
        case 'grs1':
            return 'Grissik Cam 1'; break;
        case 'grs2':
            return 'Grissik Cam 2'; break;
        case 'grs3':
            return 'Grissik Cam 3'; break;
        case 'grs4':
            return 'Grissik Cam 4'; break;
        case 'japanan':
            return 'Japanan'; break;
        case 'kalisogo':
            return 'Kalisogo'; break;
        case 'kdp_1':
            return 'Kedep Cam 1'; break;
        case 'kdp1':
            return 'Kedep Cam 2'; break;
        case 'kedep_1':
            return 'Kedep Cam 3'; break;
        case 'lbm1':
            return 'Labuhan Maringgai Cam 1'; break;
        case 'lbm2':
            return 'Labuhan Maringgai Cam 2'; break;
        case 'lirik':
            return 'Lirik'; break;
        case 'mbk1':
            return 'MBK Cam 1'; break;
        case 'mbk2':
            return 'MBK Cam 2'; break;
        case 'mbk3':
            return 'MBK Cam 3'; break;
        case 'mbk4':
            return 'MBK Cam 4'; break;
        case 'mbk5':
            return 'MBK Cam 5'; break;
        case 'ngoro':
            return 'Ngoro'; break;
        case 'ngr_1':
            return 'Ngoro Cam 1'; break;
        case 'panaran':
            return 'Panaran'; break;
        case 'pasarix':
            return 'Pasar IX'; break;
        case 'pasarix2':
            return 'Pasar IX Cam 2'; break;
        case 'pasarix3':
            return 'Pasar IX Cam 3'; break;
        case 'pasarix4':
            return 'Pasar IX Cam 4'; break;
        case 'pasarix5':
            return 'Pasar IX Cam 5'; break;
        case 'pasarix6':
            return 'Pasar IX Cam 6'; break;
        case 'payapasir':
            return 'Payapasir'; break;
        case 'pdungu2_1':
            return 'Pondok Ungu 2 Cam 1'; break;
        case 'pdungu2_2':
            return 'Pondok Ungu 2 Cam 2'; break;
        case 'perawang':
            return 'Perawang Cam 1'; break;
        case 'perawang1':
            return 'Perawang Cam 2'; break;
        case 'pgdmet1':
            return 'Pagar Dewa Metering Cam 1'; break;
        case 'pgdmet2':
            return 'Pagar Dewa Metering Cam 2'; break;
        case 'pgdspg1':
            return 'Pagar Dewa SPG Cam 1'; break;
        case 'pgdspg2':
            return 'Pagar Dewa SPG Cam 2'; break;
        case 'pgdspg3':
            return 'Pagar Dewa SPG Cam 3'; break;
        case 'pgdspg4':
            return 'Pagar Dewa SPG Cam 4'; break;
        case 'pgdspg5':
            return 'Pagar Dewa SPG Cam 5'; break;
        case 'pier':
            return 'Pier'; break;
        case 'semare':
            return 'Semare'; break;
        case 'serpong':
            return 'Serpong'; break;
        case 'skpudik':
            return 'Sekampung Udik'; break;
        case 'stasiun_bitung':
            return 'Stasiun Bitung'; break;
        case 'Stasiun Cikande':
            return 'Stasiun Cikande'; break;
        case 'stasiun_serpong':
            return 'Stasiun Serpong'; break;
        case 'sunyaragi':
            return 'Sunyaragi'; break;
        case 'suryacipta':
            return 'Surya Cipta'; break;
        case 'sutami':
            return 'Sutami'; break;
        case 'tandes':
            return 'Tandes'; break;
        case 'bjn2':
            return 'Bojonegara 2'; break;
        case 'tbg1':
            return 'Tebanggi Besar Cam 1'; break;
        case 'tbg2':
            return 'Tebanggi Besar Cam 2'; break;
        case 'tbg3':
            return 'Tebanggi Besar Cam 3'; break;
        case 'tbg4':
            return 'Tebanggi Besar Cam 4'; break;
        case 'tgl_gd':
            return 'Tegal Gede'; break;
        case 'tld':
            return 'tld'; break;
        case 'ukui':
            return 'Ukui'; break;
        default: return 'Unknown Name'; break;
    }
}

module.exports = { parseLabelIntoName }