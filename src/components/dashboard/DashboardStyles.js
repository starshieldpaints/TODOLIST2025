import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    statCardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: { width: '48%', marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    statTitle: { color: '#fff', marginTop: 8, fontWeight: '600' },
    statValue: { color: '#fff', fontWeight: '700', marginTop: 4 },

    modalOverlay: { flex: 1, justifyContent: 'center', padding: 16 },
    modalContent: { borderRadius: 12, padding: 16, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },

    cardItem: {
        marginBottom: 10,
        borderRadius: 10,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        borderLeftWidth: 6,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardSubtitle: { fontSize: 14 },

    legendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendLabel: { marginLeft: 6, fontSize: 12 },
    statusBadge: { width: 12, height: 12, borderRadius: 6 },
    closeButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },

    detailLabel: { fontWeight: '700', marginTop: 10, marginBottom: 4 },
    detailText: { fontSize: 14, lineHeight: 20 },
});