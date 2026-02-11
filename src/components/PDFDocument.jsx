import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#1e293b',
        paddingBottom: 20,
        marginBottom: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoSection: {
        width: '60%',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    subLogoText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    invoiceInfo: {
        width: '40%',
        textAlign: 'right',
    },
    label: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 2,
    },
    value: {
        fontSize: 12,
        color: '#0f172a',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 4,
    },
    text: {
        fontSize: 11,
        color: '#334155',
        lineHeight: 1.5,
    },
    statusBadge: {
        padding: '4px 8px',
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    // Estilos para galería
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 10,
    },
    galleryItem: {
        width: '48%', // 2 por fila
        marginBottom: 10,
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        border: 1,
        borderColor: '#e2e8f0'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 9,
        color: '#94a3b8',
    }
});

const PDFDocument = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoSection}>
                    {/* Usamos window.location.origin para asegurar la ruta completa al generar el BLOB */}
                    <Image
                        src={window.location.origin + '/logo.png'}
                        style={{ width: 120, height: 60, objectFit: 'contain', marginBottom: 5 }}
                    />
                    <Text style={styles.subLogoText}>Tecnología Creativa</Text>
                </View>
                <View style={styles.invoiceInfo}>
                    <Text style={styles.label}>DICTAMEN TÉCNICO NO.</Text>
                    <Text style={styles.value}>#{data.id ? data.id.slice(-6).toUpperCase() : 'BORRADOR'}</Text>
                    <Text style={styles.label}>FECHA DE EMISIÓN</Text>
                    <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
                </View>
            </View>

            <Text style={styles.text}>
                Por medio de la presente se hace entrega del dictamen técnico correspondiente a la revisión
                del equipo recibido en nuestras instalaciones.
            </Text>

            {/* Customer & Device Info */}
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
                <View style={{ width: '50%', paddingRight: 10 }}>
                    <Text style={styles.sectionTitle}>Datos del Cliente</Text>
                    <Text style={styles.text}>{data.customerName}</Text>
                    {data.customerCompany && (
                        <Text style={[styles.text, { fontWeight: 'bold' }]}>{data.customerCompany}</Text>
                    )}
                    <Text style={styles.text}>{data.customerEmail}</Text>
                    <Text style={styles.text}>{data.customerPhone}</Text>
                </View>
                <View style={{ width: '50%', paddingLeft: 10 }}>
                    <Text style={styles.sectionTitle}>Datos del Equipo</Text>
                    <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Tipo:</Text> {data.deviceType}</Text>
                    <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Modelo:</Text> {data.deviceModel}</Text>
                    <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Serie:</Text> {data.deviceSerial || 'N/A'}</Text>
                </View>
            </View>

            {/* Diagnosis Section */}
            <Text style={styles.sectionTitle}>Reporte y Diagnóstico</Text>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>FALLA REPORTADA:</Text>
                <Text style={styles.text}>{data.problemDescription}</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>DIAGNÓSTICO TÉCNICO:</Text>
                <Text style={styles.text}>{data.diagnosis || 'Pendiente de diagnóstico final.'}</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>SOLUCIÓN APLICADA / RECOMENDADA:</Text>
                <Text style={styles.text}>{data.solution || 'Pendiente de reparación.'}</Text>
            </View>

            {/* Status */}
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>ESTADO: {data.status?.toUpperCase()}</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    JJLAB Tecnología Creativa
                </Text>
            </View>
        </Page>

        {/* Página de Evidencia Fotográfica (Si hay fotos) */}
        {data.photos && data.photos.length > 0 && (
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Text style={styles.logoText}>Anexo Fotográfico</Text>
                        <Text style={styles.subLogoText}>Evidencia del Servicio #{data.id ? data.id.slice(-6).toUpperCase() : ''}</Text>
                    </View>
                </View>

                <View style={styles.galleryGrid}>
                    {data.photos.map((photoUrl, index) => (
                        <View key={index} style={styles.galleryItem}>
                            <Image src={photoUrl} style={styles.image} />
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        JJLAB Tecnología Creativa
                    </Text>
                </View>
            </Page>
        )}
    </Document>
);

export default PDFDocument;
