import { IonContent, IonFooter, IonHeader, IonPage, IonRefresher, IonRefresherContent } from "@ionic/react";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

export default function Phone({ id, title, alertCount, onGo, onAction, actionLabel, onRefresh, children }) {
  return (
    <IonPage className="mobile-page" id={`phone-${id}`}>
      <IonHeader className="ion-no-border">
        <TopBar title={title} alertCount={alertCount} onGo={onGo} />
      </IonHeader>
      <IonContent id="main" role="main" tabIndex={-1}>
        <IonRefresher slot="fixed" onIonRefresh={async (event) => {
          try { await onRefresh(); } finally { event.detail.complete(); }
        }}>
          <IonRefresherContent pullingText="Tarik untuk memperbarui" refreshingText="Memperbarui data…" />
        </IonRefresher>
        {children}
      </IonContent>
      <IonFooter className="ion-no-border">
        <BottomNav active={id} onGo={onGo} onAction={onAction} actionLabel={actionLabel} ionic />
      </IonFooter>
    </IonPage>
  );
}
