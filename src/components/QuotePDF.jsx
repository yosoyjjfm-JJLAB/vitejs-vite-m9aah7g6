import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#1e293b', // Slate 800
        paddingBottom: 20,
    },
    logoSection: {
        width: '50%',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    subLogoText: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },
    companyInfo: {
        marginTop: 10,
        fontSize: 9,
        color: '#475569',
    },
    invoiceInfo: {
        width: '40%',
        textAlign: 'right',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    label: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    value: {
        fontSize: 11,
        color: '#0f172a',
        fontWeight: 'medium',
    },
    clientSection: {
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6', // Blue 500
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginBottom: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
        minHeight: 30, // Altura mínima para filas
        alignItems: 'center', // Centrar verticalmente
    },
    tableHeader: {
        backgroundColor: '#f1f5f9', // Slate 100
    },
    tableCol: {
        width: "15%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: "#e2e8f0",
        padding: 5,
    },
    tableColDesc: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: "#e2e8f0",
        padding: 5,
    },
    tableColImage: {
        width: "10%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: "#e2e8f0",
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableCellHeader: {
        margin: "auto",
        fontSize: 9,
        fontWeight: 'bold',
        color: '#334155',
    },
    tableCell: {
        margin: "auto",
        fontSize: 9,
        color: '#334155',
    },
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 5,
        justifyContent: 'flex-end',
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        paddingRight: 10,
        fontSize: 10,
        color: '#64748b',
    },
    totalValue: {
        width: 100,
        textAlign: 'right',
        fontSize: 10,
        color: '#0f172a',
        fontWeight: 'bold',
    },
    finalTotal: {
        fontSize: 12,
        color: '#0f172a', // Blue 700
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        paddingTop: 5,
        marginTop: 5,
    },
    terms: {
        marginTop: 40,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
    },
    productImage: {
        width: 25,
        height: 25,
        objectFit: 'contain',
    }
});

const QuotePDF = ({ data }) => {
    // Calculos
    const subtotal = data.items.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
    const taxRate = data.taxRate || 0.16; // 16% por defecto si no viene
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header con Logo */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {/* IMAGEN DEL LOGO - CONFIRMADO */}
                        <Image
                            src={window.location.origin + '/logo.png'}
                            style={{ width: 100, height: 50, objectFit: 'contain', marginBottom: 5 }}
                        />
                        <Text style={styles.subLogoText}>Tecnología Creativa</Text>
                        <View style={styles.companyInfo}>
                            <Text>Servicios de Electrónica y automatización</Text>
                            <Text>Tel: 984 131 8433</Text>
                            <Text>Email: jjlab2020@gmail.com</Text>
                        </View>
                    </View>
                    <View style={styles.invoiceInfo}>
                        <Text style={styles.title}>COTIZACIÓN</Text>
                        <Text style={styles.label}>NÚMERO</Text>
                        <Text style={styles.value}>#{data.quoteNumber || 'BORRADOR'}</Text>
                        <Text style={styles.label}>FECHA</Text>
                        <Text style={styles.value}>{new Date().toLocaleDateString('es-MX')}</Text>
                        <Text style={styles.label}>VÁLIDO HASTA</Text>
                        <Text style={styles.value}>{data.validUntil || '30 días segun fecha'}</Text>
                    </View>
                </View>

                {/* Datos del Cliente */}
                <View style={styles.clientSection}>
                    <Text style={styles.sectionTitle}>Preparado para:</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.customerName}</Text>
                    {data.customerCompany && <Text style={{ fontSize: 10, color: '#475569' }}>{data.customerCompany}</Text>}
                    <Text style={{ fontSize: 10, marginTop: 4 }}>{data.customerEmail}</Text>
                    <Text style={{ fontSize: 10 }}>{data.customerPhone}</Text>
                </View>

                {/* Tabla de Items */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.tableColImage}>
                            <Text style={styles.tableCellHeader}>Foto</Text>
                        </View>
                        <View style={styles.tableColDesc}>
                            <Text style={styles.tableCellHeader}>Descripción</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellHeader}>Cant.</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellHeader}>P. Unit</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableCellHeader}>Total</Text>
                        </View>
                    </View>

                    {data.items.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableColImage}>
                                {item.image ? (
                                    <Image src={item.image} style={styles.productImage} />
                                ) : (
                                    <Text style={styles.tableCell}>-</Text>
                                )}
                            </View>
                            <View style={styles.tableColDesc}>
                                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{item.name}</Text>
                                <Text style={{ fontSize: 8, color: '#64748b' }}>{item.description}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{item.quantity}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{formatCurrency(item.unitPrice)}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{formatCurrency(item.total)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Totales */}
                <View style={styles.totalsSection}>
                    <View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA ({Math.round(taxRate * 100)}%):</Text>
                            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.finalTotal]}>
                            <Text style={[styles.totalLabel, { color: '#0f172a', fontWeight: 'bold' }]}>TOTAL:</Text>
                            <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Términos y Condiciones */}
                <View style={styles.terms}>
                    <Text style={styles.sectionTitle}>Términos y Condiciones</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4 }}>
                        {data.notes || 'Esta cotización tiene una validez de 30 días. Los precios están sujetos a cambios sin previo aviso. Para confirmar el trabajo se requiere el 50% de anticipo. Tiempos de entrega sujetos a disponibilidad de piezas.'}
                    </Text>
                    {/* Link de búsqueda (Idea del usuario) - Si es útil imprimirlo */}
                    {/* <Text style={{ marginTop: 10, fontSize: 8, color: '#94a3b8' }}>Generado digitalmente por JJLAB Admin.</Text> */}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        JJLAB Tecnología Creativa
                    </Text>
                </View>

            </Page>
        </Document>
    );
};

export default QuotePDF;
